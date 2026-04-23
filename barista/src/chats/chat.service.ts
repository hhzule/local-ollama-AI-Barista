/**
 * @fileoverview This file defines the ChatService, a NestJS injectable service
 * that implements a conversational AI agent for ordering drinks.
 * The agent is built using LangChain's LangGraph framework and interacts with a MongoDB database.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoClient } from 'mongodb';
import { Model } from 'mongoose';
import { tool } from '@langchain/core/tools';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
// import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { Annotation } from '@langchain/langgraph';
import { START, END } from '@langchain/langgraph';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import z from 'zod';
import { Order } from './schema/order.schema';
import {
  OrderParser,
  OrderSchema,
  OrderType,
} from './../util/schemas/orders/Order.schema';
import { DrinkParser } from './../util/schemas/drinks/Drink.schema';
import { DRINKS } from './../util/constants/drinks_data';
import {
  createSweetenersSummary,
  availableToppingsSummary,
  createAvailableMilksSummary,
  createSyrupsSummary,
  createSizesSummary,
  createDrinkItemSummary,
} from '../util/summeries/drink';

// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

const client: MongoClient = new MongoClient(process.env.MONGO_URI || '');
const database_name = 'drinks_db';

/**
 * ChatService is a NestJS injectable service that orchestrates the
 * conversational AI agent.
 */
@Injectable()
export class ChatService {
  /**
   * Constructs the ChatService with the Mongoose Order model injected.
   * @param orderModel The Mongoose model for the Order schema.
   */
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  /**
   * Main method to chat with the AI agent.
   * Orchestrates the LangGraph state machine to handle user queries,
   * manage conversation state, and interact with the database.
   *
   * @param thread_id A unique identifier for the conversation thread.
   * @param query The user's message.
   * @returns A JSON object containing the AI's response, current order details,
   * suggestions, and progress status.
   */

  chatWithAgent = async ({
    thread_id,
    query,
  }: {
    thread_id: string;
    query: string;
  }) => {
    await client.connect();
    // Define LangGraph state
    const graphState = Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => [...x, ...y],
      }),
    });

    /**
     * Tool for creating a new order in the database.
     */
    const orderTool = tool(
      async ({ input }: { input: string }) => {
        try {
          const parsed = JSON.parse(input);
          const order = parsed.order;

          // Validate required fields
          if (!order || !order.drink) {
            return 'Invalid order format. Missing required fields.';
          }
          await this.orderModel.create(order);
          return 'Order created successfully'; //Inform the LLM about the status of the order.
        } catch (error) {
          console.log(error);
          return 'Failed to create the order';
        }
      },

      {
        // schema: z.object({
        //   order: OrderSchema.describe(
        //     'The order that will be stored in the DB',
        //   ),
        // }), // The struture of how the data passed to the tool should look like
        name: 'create_order', // The tool name
        description: 'This tool creates a new order in the database', // A comprehensive description of what the tool does.
      },
    );
    const tools = [orderTool];
    /**
     * The agent node: Builds prompts, calls the model, and returns AI responses.
     */
    const callModal = async (states: typeof graphState.State) => {
      const prompt = ChatPromptTemplate.fromMessages([
        {
          role: 'system',
          content: `
            You are a helpful assistant that helps users order drinks from Starbucks.
            Your job is to take the user's request and fill in any missing details based on how a complete order should look.
            A complete order follows this structure: ${OrderParser}.

            **TOOLS**
            You have access to a "create_order" tool.
            Use this tool when the user confirms the final order.
            After calling the tool, you should inform the user whether the order was successfully created or if it failed.

            **DRINK DETAILS**
            Each drink has its own set of properties such as size, milk, syrup, sweetener, and toppings.
            Here is the drink schema: ${DrinkParser}.

            You must ask for any missing details before creating the order.

            If the user requests a modification that is not supported for the selected drink, tell them that it is not possible.

            If the user asks for something unrelated to drink orders, politely tell them that you can only assist with drink orders.

            **AVAILABLE OPTIONS**
            List of available drinks and their allowed modifications:
            ${DRINKS.map((drink) => `- ${createDrinkItemSummary(drink)}`)}

            Sweeteners: ${createSweetenersSummary()}
            Toppings: ${availableToppingsSummary()}
            Milks: ${createAvailableMilksSummary()}
            Syrups: ${createSyrupsSummary()}
            Sizes: ${createSizesSummary()}

            Order schema: ${OrderParser}

            If the user's query is unclear, tell them that the request is not clear.

            **ORDER CONFIRMATION**
            Once the order is ready, you must ask the user to confirm it.
            If they confirm, immediately call the "create_order" tool.
            Only respond after the tool completes, indicating success or failure.

            **FRONTEND RESPONSE FORMAT**
            Every response must include:

            "message": "Your message to the user",
            "current_order": "The order currently being constructed",
            "suggestions": "Options the user can choose from",
            "progress": "Order status ('completed' after creation)"

            **IMPORTANT RULES**
            - Be friendly, use emojis, and add humor.
            - Use null for unfilled fields.- Keep responses under 50 words
            - Limit suggestions to 3 items only
            - Don't repeat information
            - Never omit the JSON tracking object.
        `,
        },
        new MessagesPlaceholder('messages'),
      ]);

      const formattedPrompt = await prompt.formatMessages({
        time: new Date().toISOString(),
        messages: states.messages,
      });

      //   const chat = new ChatGoogleGenerativeAI({
      //     model: 'gemini-2.0-flash',
      //     temperature: 0,
      //     apiKey: GOOGLE_API_KEY,
      //   }).bindTools(tools);

      const model = new ChatOllama({
        model: OLLAMA_MODEL, // Default value.
        baseUrl: OLLAMA_BASE_URL,
        temperature: 0,
        maxRetries: 2,
         numPredict: 150,        // Limit tokens generated (default is infinite)
        // topK: 40,              // Reduce from default 40
        // topP: 0.9,             // Slightly reduce
        // repeatPenalty: 1.1,    // Slight penalty to avoid repetition
      }).bindTools(tools);

      // For Ollama with tool binding, you might need to use a different approach
      // since Ollama's tool support is evolving. Alternative approach below.

      const result = await model.invoke(formattedPrompt);

      // Parse the response as an AIMessage
      //   const aiMessage = new AIMessage({
      //     content: result,
      //   });

      return { messages: [result] };
    };

    /**
     * Determines whether to execute tools or end the conversation.
     */
    const shouldContinue = (state: typeof graphState.State) => {
      const lastMessage = state.messages[
        state.messages.length - 1
      ] as AIMessage;
      return lastMessage.tool_calls?.length ? 'tools' : END;
    };

    const toolsNode = new ToolNode<typeof graphState.State>(tools as any);
    /**
     * Build the conversation graph.
     */
    const graph = new StateGraph(graphState)
      .addNode('agent', callModal)
      .addNode('tools', toolsNode)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', shouldContinue)
      .addEdge('tools', 'agent');

    const checkpointer = new MongoDBSaver({ client, dbName: database_name });
    const app = graph.compile({ checkpointer });

    /**
     * Run the graph using the user's message.
     */
    const finalState = await app.invoke(
      { messages: [new HumanMessage(query)] },
      { recursionLimit: 15, configurable: { thread_id } },
    );
    /**
     * Extract JSON payload from AI response.
     */
    // function extractJsonResponse(response: any) {
    //   console.log(response);
    //   const match = response.match(/```json\s*([\s\S]*?)\s*```/i);
    // //   if (match && match[1] && typeof response === 'string') {
    //     return JSON.parse(match[1].trim());
    
    // }

// function extractJsonResponse(response: any) {
//   console.log("Raw response:", response);
  
//   // If response is a string, try to parse it
//   let parsed = response;
//   if (typeof response === 'string') {
//     try {
//       parsed = JSON.parse(response);
//     } catch (e) {
//       // Not valid JSON, try to extract JSON from string
//       const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/i);
//       if (jsonMatch && jsonMatch[1]) {
//         parsed = JSON.parse(jsonMatch[1].trim());
//       } else {
//         // Try to find any JSON object in the string
//         const objectMatch = response.match(/\{[\s\S]*\}/);
//         if (objectMatch) {
//           parsed = JSON.parse(objectMatch[0]);
//         } else {
//           // Try array match (for tool calls)
//           const arrayMatch = response.match(/\[[\s\S]*\]/);
//           if (arrayMatch) {
//             parsed = JSON.parse(arrayMatch[0]);
//           }
//         }
//       }
//     }
//   }
  
//   // Handle the case where response is an array with tool calls
//   if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name === 'response') {
//     console.log("Detected tool call format, extracting arguments");
//     return parsed[0].arguments;
//   }
  
//   // Handle case where parsed has name and arguments directly
//   if (parsed.name === 'response' && parsed.arguments) {
//     console.log("Detected object with name/arguments, extracting arguments");
//     return parsed.arguments;
//   }
  
//   // Ensure all required fields exist
//   if (!parsed.message) {
//     parsed.message = "How can I help you with your order today?";
//   }
//   if (!parsed.current_order) {
//     parsed.current_order = null;
//   }
//   if (!parsed.suggestions) {
//     parsed.suggestions = ["Latte", "Cappuccino", "Espresso"];
//   }
//   if (!parsed.progress) {
//     parsed.progress = "in_progress";
//   }
  
//   // Handle case where suggestions is a string instead of array
//   if (typeof parsed.suggestions === 'string') {
//     parsed.suggestions = parsed.suggestions.split(',').map(s => s.trim());
//   }
  
//   return parsed;
// }

    const lastMessage = finalState.messages.at(-1) as AIMessage;

    return lastMessage.content;
  };
}




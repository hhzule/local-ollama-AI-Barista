import z from "zod";
import { StructuredOutputParser } from 'langchain/output_parsers';
export const DrinkSchema = z.object({
  name: z.string(),            // Required name of the drink
  description: z.string(),     // Required explanation of what the drink is
  supportMilk: z.boolean(),    // Whether milk options are available
  supportSweeteners: z.boolean(), // Whether sweeteners can be added
  supportSyrup: z.boolean(),   // Whether flavor syrups are allowed
  supportTopping: z.boolean(), // Whether toppings are supported
  supportSize: z.boolean(),    // Whether the drink can be ordered in sizes
  image: z.string().url().optional(), // Optional image URL
});

export const SweetenerSchema = z.object({
  name: z.string(),                // Sweetener name
  description: z.string(),         // What it is / taste description
  image: z.string().url().optional(), // Optional image URL
});

export const SyrupSchema = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().url().optional(),
});

export const ToppingSchema = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().url().optional(),
});

export const SizeSchema = z.object({
  name: z.string(),               // e.g. Small, Medium
  description: z.string(),        // A short explanation
  image: z.string().url().optional(),
});

export const MilkSchema = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().url().optional(),
});

export const ToppingsSchema = z.array(ToppingSchema);
export const SizesSchema = z.array(SizeSchema);
export const MilksSchema = z.array(MilkSchema);
export const SyrupsSchema = z.array(SyrupSchema);
export const SweetenersSchema = z.array(SweetenerSchema);
export const DrinksSchema = z.array(DrinkSchema);

export type Drink = z.infer<typeof DrinkSchema>;
export type SupportSweetener = z.infer<typeof SweetenerSchema>;
export type Syrup = z.infer<typeof SyrupSchema>;
export type Topping = z.infer<typeof ToppingSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type Milk = z.infer<typeof MilkSchema>;

export type Toppings = z.infer<typeof ToppingsSchema>;
export type Sizes = z.infer<typeof SizesSchema>;
export type Milks = z.infer<typeof MilksSchema>;
export type Syrups = z.infer<typeof SyrupsSchema>;
export type Sweeteners = z.infer<typeof SweetenersSchema>;
export type Drinks = z.infer<typeof DrinksSchema>;

/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into a single, validated Drink object conforming to DrinkSchema.
 */
export const DrinkParser = StructuredOutputParser.fromZodSchema(
  DrinkSchema as any, // 'as any' is a TypeScript cast, sometimes used with libraries for flexibility.
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into a single, validated Topping object conforming to ToppingSchema.
 */
export const ToppingParser = StructuredOutputParser.fromZodSchema(
  ToppingSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into a single, validated Size object conforming to SizeSchema.
 */
export const SizeParser = StructuredOutputParser.fromZodSchema(
  SizeSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into a single, validated Milk object conforming to MilkSchema.
 */
export const MilkParser = StructuredOutputParser.fromZodSchema(
  MilkSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into a single, validated Syrup object conforming to SyrupSchema.
 */
export const SyrupParser = StructuredOutputParser.fromZodSchema(
  SyrupSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into a single, validated Sweetener object conforming to SweetenerSchema.
 */
export const SweetenerParser = StructuredOutputParser.fromZodSchema(
  SweetenerSchema as any,
);

// Parsers for arrays
// These are used when the AI model is expected to output a list of items,
// which the parser will then transform into a TypeScript array of validated objects.

/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into an array of validated Drink objects conforming to DrinksSchema.
 */
export const DrinksParser = StructuredOutputParser.fromZodSchema(
  DrinksSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into an array of validated Topping objects conforming to ToppingsSchema.
 */
export const ToppingsParser = StructuredOutputParser.fromZodSchema(
  ToppingsSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into an array of validated Size objects conforming to SizesSchema.
 */
export const SizesParser = StructuredOutputParser.fromZodSchema(
  SizesSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into an array of validated Milk objects conforming to MilksSchema.
 */
export const MilksParser = StructuredOutputParser.fromZodSchema(
  MilksSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into an array of validated Syrup objects conforming to SyrupsSchema.
 */
export const SyrupsParser = StructuredOutputParser.fromZodSchema(
  SyrupsSchema as any,
);
/**
 * @description StructuredOutputParser for parsing unstructured text from an AI model
 * into an array of validated Sweetener objects conforming to SweetenersSchema.
 */
export const SweetenersParser = StructuredOutputParser.fromZodSchema(
  SweetenersSchema as any,
);
// This file ensures that the type declarations are properly included in the build
// It explicitly re-exports the types from the declaration file

// Reference the declaration file
/// <reference path="./index.d.ts" />

// For TypeScript to correctly include the declaration file in the build output
export {};

// Re-export the type definitions
export * from "./types";

// Other exports from this module would go here

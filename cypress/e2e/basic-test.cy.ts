/// <reference types="cypress" />

describe("Basic Test", () => {
  it("should visit the Cypress example page", () => {
    cy.visit("https://example.cypress.io/commands/actions");
    cy.get(".action-email").should("exist");
    cy.log("Basic test passed - page loaded correctly");
  });
});

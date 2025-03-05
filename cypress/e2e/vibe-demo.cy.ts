describe("Vibe Check Demo", () => {
  beforeEach(() => {
    // Configure the vibe checks for all tests
    cy.configureVibes({
      confidenceThreshold: 0.8,
      provider: "openai",
    });

    // Visit the example site
    cy.visit("https://example.cypress.io/commands/actions");
  });

  it("should verify an email input field using vibeCheck", () => {
    cy.get(".action-email")
      .should("be.visible")
      .vibeCheck("This is an input field for email address entry");
  });

  it("should verify a button with custom options", () => {
    cy.get(".action-btn").vibeCheck(
      'This is a red button that says "Click to toggle popover"',
      {
        confidenceThreshold: 0.9,
      }
    );
  });

  it("should be able to chain commands after a passing vibeCheck", () => {
    cy.get(".action-email")
      .vibeCheck("This is an input field for entering email addresses")
      .type("test@example.com")
      .should("have.value", "test@example.com");
  });
});

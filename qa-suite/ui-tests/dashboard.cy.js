describe("Operational Intelligence Dashboard", () => {

    beforeEach(() => {
        // Note: Adjust the URL if the dev server runs on a different port or path
        cy.visit("/dashboard")
    })

    it("Loads dashboard successfully", () => {
        cy.contains("Operational Intelligence").should("be.visible")
    })

    it("Shows correct user clocked in", () => {
        cy.contains("Clocked").should("exist")
    })

    it("Clock button works", () => {
        // Assuming "CLOCK IN" is the text on the button
        cy.contains("CLOCK IN").click()
        cy.contains("Clocked").should("exist")
    })

    it("Calendar navigation works", () => {
        cy.get("[data-test=calendar-next]").click()
        cy.get("[data-test=calendar-month]").should("exist")
    })

    it("Sidebar navigation works", () => {
        cy.contains("Inventory").click()
        cy.url().should("include", "inventory")
    })

    it("Active orders empty state", () => {
        cy.contains("Desk Clear").should("exist")
    })

    it("Security: Prevents SQL Injection in search", () => {
        cy.get("input[placeholder*='Search']").type("' OR 1=1 --{enter}")
        // Check that it doesn't crash or return all records
        cy.contains("No results").should("exist")
    })

    it("Security: Prevents XSS in inputs", () => {
        cy.get("input[placeholder*='Search']").type("<script>alert(1)</script>{enter}")
        // Verify script didn't execute (no alert, or simply text is escaped)
        cy.contains("<script>").should("be.visible")
    })
})

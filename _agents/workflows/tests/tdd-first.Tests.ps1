
Describe "Assistant TDD Workflow Integrity" {
    It "should have a workflow file named tdd-first.md" {
        $workflowPath = "c:\Users\SAM\Documents\Antigravity\Englabs Inventory 2026-27\_agents\workflows\tdd-first.md"
        Test-Path $workflowPath | Should Be $true
    }

    It "should contain a YAML frontmatter with a description" {
        $content = Get-Content "c:\Users\SAM\Documents\Antigravity\Englabs Inventory 2026-27\_agents\workflows\tdd-first.md" -Raw
        $content | Should Match "^---[\r\n]+description: "
    }
}

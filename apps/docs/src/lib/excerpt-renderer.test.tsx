import React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { getExcerptText, renderExcerpt } from "./excerpt-renderer"

describe("renderExcerpt", () => {
  it("renders a normal highlighted excerpt with mark elements", () => {
    const excerpt = "This is a <mark>perpetuals</mark> guide with <mark>funding</mark> rates."
    const { container } = render(<div>{renderExcerpt(excerpt)}</div>)

    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(2)
    expect(marks[0]?.textContent).toBe("perpetuals")
    expect(marks[1]?.textContent).toBe("funding")
    expect(marks[0]?.className).toContain("font-semibold")
    expect(container.textContent).toBe("This is a perpetuals guide with funding rates.")
  })

  it("treats scripts, images, links and forms inside excerpts as plain text", () => {
    const maliciousExcerpt =
      '<script>alert("xss")</script><img src="x" onerror="alert(1)" /><a href="https://malicious.example.com">Phishing link</a><form action="/steal"><input name="token" /></form> and <mark>safe highlight</mark>'

    const { container } = render(<div>{renderExcerpt(maliciousExcerpt)}</div>)

    // No dangerous HTML tags should be rendered into the DOM
    expect(container.querySelector("script")).toBeNull()
    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("a")).toBeNull()
    expect(container.querySelector("form")).toBeNull()
    expect(container.querySelector("input")).toBeNull()

    // Highlighting must be preserved
    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
    expect(marks[0]?.textContent).toBe("safe highlight")

    // The malicious markup must be rendered as visible text, not executable elements
    expect(container.textContent).toContain('<script>alert("xss")</script>')
    expect(container.textContent).toContain('<img src="x" onerror="alert(1)" />')
    expect(container.textContent).toContain('<a href="https://malicious.example.com">Phishing link</a>')
    expect(container.textContent).toContain('<form action="/steal"><input name="token" /></form>')
  })

  it("handles empty or null excerpts gracefully", () => {
    const { container: nullContainer } = render(<div>{renderExcerpt(null)}</div>)
    expect(nullContainer.textContent).toBe("")

    const { container: emptyContainer } = render(<div>{renderExcerpt("")}</div>)
    expect(emptyContainer.textContent).toBe("")
  })
})

describe("getExcerptText", () => {
  it("removes highlight tags and decodes entities in search excerpts", () => {
    expect(getExcerptText("A &amp; <mark>B &lt; C</mark> &quot;D&quot;"))
      .toBe('A & B < C "D"')
  })
})

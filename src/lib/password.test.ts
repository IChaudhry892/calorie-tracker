import { describe, expect, it } from "vitest";
import { passwordError } from "./password";

describe("passwordError", () => {
  it("accepts a password that meets every rule", () => {
    expect(passwordError("Abcde1!")).toBeNull();
    expect(passwordError("xY9`zzzz")).toBeNull();
  });

  it("lists every rule for an empty password, in order", () => {
    expect(passwordError("")).toBe(
      "Password needs at least 6 characters, a lowercase letter, an uppercase letter, a number and a symbol.",
    );
  });

  it("flags each missing class on its own", () => {
    expect(passwordError("ABCDE1!")).toBe("Password needs a lowercase letter.");
    expect(passwordError("abcde1!")).toBe("Password needs an uppercase letter.");
    expect(passwordError("Abcdef!")).toBe("Password needs a number.");
    expect(passwordError("Abcdef1")).toBe("Password needs a symbol.");
    expect(passwordError("Ab1!")).toBe("Password needs at least 6 characters.");
    expect(passwordError("abcD1")).toBe("Password needs at least 6 characters and a symbol.");
  });

  it("doesn't count spaces or non-ASCII letters as symbols", () => {
    expect(passwordError("Abcde1 é")).toBe("Password needs a symbol.");
  });
});

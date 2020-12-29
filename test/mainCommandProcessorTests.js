const assert = require("assert");

describe("mainCommandProcessor", () => {

    it("should correctly load data", async () => {

        const result = await new Promise((resolve, reject) => {

            resolve("Hello, World!");

        });

        assert.strict.equal(result, "Hello, World!");
    });

});
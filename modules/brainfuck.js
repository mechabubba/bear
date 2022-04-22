/**
 * This file executes brainfuck programs.
 * Typically launched as a fork from bot/commands/brainfuck.js. Used as such;
 *
 * `const child = fork("./brainfuck.js", ["input text", "<program>"]);`
 *
 * Every message sent to the parent process will be an object with property "result".
 */
const args = process.argv.splice(2);
const operation_limit = 25000000; // A limit to the amount of "operations" that can occur; in this case, an operation is the execution of one opcode.
const debug_limit = 64; // A limit to the amount of bytes get returned had a breakpoint gets hit.

/** @typedef {BrainfuckResult} number */

/**
 * An enumeration representing our results.
 * @readonly
 * @enum {BrianfuckResult}
 */
const result = {
    SUCCESS: 1,
    WARNING: 0,
    FAILURE: -1,
}

/**
 * The result returned from execute().
 * @typedef {Object} BrainfuckExecution
 * @property {BrainfuckResult} result The resulting "code" from our execution.
 * @property {string} log A short error/success message.
 * @property {string} output The computed output at the end of the execution.
 */

/**
 * Executes the brainfuck program.
 * @param {string} program The program.
 * @param {string} input Input given to the program.
 * @returns {BrainfuckExecution} The resulting execution.
 */
const execute = (program, input) => {
    program = program.replace(/[^+\-[\].,<>#]+/g, ""); // Sanitizes the code of any text other than the specified opcodes.
    let pmem = 0,       // Memory pointer.
        pprog = 0,      // Program pointer.
        operations = 0, // The number of operations.
        done = false,   // Whether we're done or not.
        breakpoint = false, // Whether we hit a breakpoint or not.
        output = "";    // The output.
    const memory = new Uint8Array(30000).fill(0);
    const stack = [];

    while(true) { // eslint-disable-line no-constant-condition
        if(operations > operation_limit) return { result: result.WARNING, log: `The program exceeded maximum operation count ${operation_limit}.`, output: output };
        switch(program[pprog]) {
            case "+":
                memory[pmem]++;
                break;

            case "-":
                memory[pmem]--;
                break;

            case ">":
                if(pmem < memory.length - 1) pmem++;
                break;

            case "<":
                if(pmem > 0) pmem--;
                break;

            case ".":
                output += String.fromCharCode(memory[pmem]);
                break;

            case ",":
                if(input) {
                    memory[pmem] = input.charCodeAt(0);
                    input = input.substring(1);
                } else {
                    memory[pmem] = 0;
                }
                break;

            case "[":
                if(memory[pmem] !== 0) {
                    stack.push(pprog);
                } else {
                    let istack = 0;
                    while(true) { // eslint-disable-line no-constant-condition
                        pprog++;
                        if(!program[pprog]) {
                            break;
                        } else if(program[pprog] == "[") {
                            istack++;
                        } else if(program[pprog] == "]") {
                            if(!istack) break;
                            istack--;
                        }
                    }
                }
                break;

            case "]":
                if(stack.length > 0) pprog = stack.pop() - 1;
                break;

            case "#":
                done = true;
                breakpoint = true;
                break;

            default:
                if(program[pprog] === undefined) done = true;
                break;
        }
        if(done) break;
        pprog++;
        operations++;
    }

    if(stack.length > 0 && !breakpoint) {
        return { result: result.FAILURE, log: `This program has a mismatched bracket.`, output: output };
    }

    if(breakpoint) {
        const head = memory.slice(0, debug_limit);
        const res = [];
        for(let i = 0; i < head.length; i += 16) {
            res.push(Array.apply([], head.slice(i, i + 16)).map(x => (x < 16 ? "0" : "") + x.toString(16).toUpperCase()));
            res[res.length - 1] = res[res.length - 1].join(" ");
        }
        output = res.join("\n");
    }

    return { result: result.SUCCESS, log: `${breakpoint ? `Broke at character ${pprog}`: "Evaluated successfully"} with ${operations} operations.`, output: output };
};


// If args has a length greater than 0, we can assume the program is being ran as a fork.
if(args.length > 0) {
    const value = execute(args[0], args[1]);
    process.send(value);
}

module.exports = { execute, result, options: { operation_limit, debug_limit } }

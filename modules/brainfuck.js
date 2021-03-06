/*
Launched as a fork from /bot/commands/brainfuck.js.
Used as such;

   const child = fork("./Brainfuck.js", ["input text", "<program>"]);

Every message sent to the parent process will be an object with property "result".
*/
const args = process.argv.splice(2);
const oplimit = 25000000;
let input = args[0];
let program = args[1];

let memory = new Uint8Array(30000).fill(0),
  pmem = 0,
  pprog = 0,
  stack = [],
  done = false;

/*
execute() returns an object with the following properties;
  - level: The log level. info > warning > error
  - log: The log itself.
  - output: The output.
*/
const execute = (program) => {
  let output = "";
  let ops = 0;
  while(true) {
    if(ops > oplimit) {
      return { level: "warning", log: `The program exceeded the maximum operation count ${oplimit}. Current output is as follows.`, output: output };
    }
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
        if(memory[pmem]) { // check if its nonzero
          stack.push(pprog);
        } else {
          let istack = 0;
          while(true) {
            pprog++;
            if(!program[pprog]) break;
            else if(program[pprog] == "[") istack++;
            else if(program[pprog] == "]") {
              if(!istack) break;
              istack--;
            }
          }
        }
        break;

      case "]":
        if(stack.length > 0) pprog = stack.pop() - 1;
        break;

      default:
        if(program[pprog] == undefined) done = true;
        break;
    }
    if(done) break;
    pprog++;
    ops++;
  }
  return { level: "info", log: `Evaluated successfully with ${ops} operations.`, output: output };
}

const value = execute(program);
process.send(value);

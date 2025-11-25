import fs from "fs";
import path from "path";

const root = process.cwd();

function scan(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");

    const lines = content.split("\n");
    lines.forEach((line, index) => {
        if (line.startsWith("import ")) {
            console.log(`${filePath}:${index + 1} → ${line}`);
        }
    });
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else if (file.endsWith(".js")) scan(full);
    }
}

walk(root);

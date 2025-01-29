import fs from "fs";
import path from "path";
import prettier from "prettier";
import glob from "glob";

const docsDir = "docs";
const devDir = "dev";

// generate `exercises` array dynamically from `exercisesDir`
const devFiles = glob.sync(`${devDir}/week*/ex*.html`);
const devArray = devFiles.map((file) => {
  const match = file.match(/week(\d+)\/ex(\d+)\.html$/);
  return match ? { week: Number(match[1]), ex: Number(match[2]) } : null;
}).filter(Boolean);
devArray.sort((a, b) => (a.week - b.week) || (a.ex - b.ex));


// generate routing js `main.js` 
const mainJsContent = `document.addEventListener("DOMContentLoaded", () => {
    const exercises = ${JSON.stringify(devArray, null, 2)};
    const listContainer = document.getElementById("exercise-list");

    exercises.forEach(({ week, ex }) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = \`week\${week}/ex\${ex}.html\`;
        a.textContent = \`Week \${week} - Exercise \${ex}\`;
        li.appendChild(a);
        listContainer.appendChild(li);
    });
});
`;

// const mainJsPath = path.join("main.js");
fs.writeFileSync('./main.js', mainJsContent);
console.log("✅ `main.js` was generated");



export default {
  input: "main.js",
  output: {
    format: "es",
    file: `${docsDir}/bundle.js`
  },
  external: [
    "three",
    "three/addons/controls/MapControls.js",
    "three/addons/controls/OrbitControls.js",
    "three/addons/geometries/ParametricGeometry.js",
    "three/src/math/MathUtils",
    "three/addons/geometries/TextGeometry.js",
    "three/addons/loaders/FontLoader.js"
  ],
  plugins: [
    {
      name: "htmlBundler",
      writeBundle: async function () {
        // gen docs folder if it doesn't exist
        if (!fs.existsSync(docsDir))
        {
          fs.mkdirSync(docsDir, { recursive: true });
        }

        // index.html for routing
        let indexHtml = fs.readFileSync("index.html", "utf8");
        const mainJsCode = fs.readFileSync("main.js", "utf8");

        // Embed `main.js` into `index.html`
        indexHtml = indexHtml.replace(
          `<script type="module" src="./main.js"></script>`,
          `<script type="module">\n${mainJsCode}\n</script>`
        );

        // Format HTML with prettier
        indexHtml = await prettier.format(indexHtml, { parser: "html" });

        // save routing HTML to docs
        fs.writeFileSync(path.join(docsDir, "index.html"), indexHtml);
        console.log("✅ `index.html` build complete");

        // embed `ex*.js` into `ex*.html` and save to `docs/`
        const htmlFiles = glob.sync(`${devDir}/week*/ex*.html`);
        for (const htmlFile of htmlFiles)
        {
          const jsFile = htmlFile.replace(".html", ".js");
          const outputHtmlFile = path.join(docsDir, htmlFile.replace(`${devDir}/`, ""));

          // Load `ex*.html`
          let htmlContent = fs.readFileSync(htmlFile, "utf8");

          // embed `ex*.js` into `ex*.html`
          if (fs.existsSync(jsFile))
          {
            const jsCode = fs.readFileSync(jsFile, "utf8");
            htmlContent = htmlContent.replace(
              `<script type="module" src="./${path.basename(jsFile)}"></script>`,
              `<script type="module">\n${jsCode}\n</script>`
            );
          }

          // Format HTML with prettier
          htmlContent = await prettier.format(htmlContent, { parser: "html" });

          // Generate directory if it doesn't exist
          const outputDir = path.dirname(outputHtmlFile);
          if (!fs.existsSync(outputDir))
          {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          // Save to `docs/`
          fs.writeFileSync(outputHtmlFile, htmlContent);
          console.log(`✅ Bundled: ${outputHtmlFile}`);
        }

        console.log("🎉 completed")

        const bundleJsPath = path.join(docsDir, 'bundle.js');
        const mainJsPath = path.join('main.js');
        const filesToDelete = [bundleJsPath, mainJsPath];

        filesToDelete.forEach((file) => {
          if (fs.existsSync(file))
          {
            fs.unlinkSync(file);
            console.log(`🗑️ delete: ${file}`);
          }
        });
      }
    }
  ]
};
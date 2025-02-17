const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const glob = require("glob");

const docsDir = "docs";
const devDir = "dev";
const mainJs = "main.js";
const resourcesDir = `${devDir}/resources`;


const resourceFiles = glob.sync(`${resourcesDir}/**/*`);
const outputDir = path.join(docsDir, resourcesDir.replace(`${devDir}/`, ""));
if (!fs.existsSync(outputDir))
  fs.mkdirSync(outputDir, { recursive: true });

for (const file of resourceFiles)
{
  const filename = path.basename(file);
  const outputFilename = path.join(outputDir, filename);

  fs.copyFileSync(file, outputFilename);
  console.log(`✅ Copied: ${outputDir}`);
}


const ghRepoLink = "https://github.com/8gaU8/3d-vis-practical-works/tree/main/docs/";

// `dev/` 以下の `.html` ファイルをすべてスキャン
const exerciseFiles = glob.sync(`${devDir}/**/*.html`);
const exercises = exerciseFiles.map((file) => {
  const match = file.match(/week(\d+)\/ex(\d+)\.html$/) || file.match(/shader\/shader_ex(\d+)\.html$/);

  if (!match) return null;

  return {
    week: match[2] ? `Week ${Number(match[1])}` : "Shader",
    ex: Number(match[2] || match[1]),
    html: `/${file.replace(`${devDir}/`, "")}`,
  };
}).filter(Boolean);

// **week, ex の順にソート**
exercises.sort((a, b) => {
  if (a.week === "Shader") return -1;  // Shader を後ろに配置
  if (b.week === "Shader") return 1;
  return (a.week - b.week) || (a.ex - b.ex);
});

// `main.js` の内容を生成
const mainJsContent = `document.addEventListener("DOMContentLoaded", () => {
    const GITHUB_PAGES_URL = "${ghRepoLink}";
    const exercises = ${JSON.stringify(exercises, null, 2)};
    const listContainer = document.getElementById("exercise-list");
    let prevHeader = null;
    exercises.forEach(({ week, ex, html}) => {
        const li = document.createElement("li");
        if (prevHeader !== week){
            const header = document.createElement("h2");
            header.textContent = week;
            listContainer.appendChild(header);
            prevHeader = week;
        }

        const htmlLink = document.createElement("a");
        htmlLink.href = \`./\${html}\`;

        htmlLink.textContent = \`\${week} - Exercise \${ex} (HTML)\`;
        li.appendChild(htmlLink);

        const ghLink = document.createElement("a");
        ghLink.href = \`${ghRepoLink}/\${html}\`;
        ghLink.textContent = " (Link for HTML code)";
        ghLink.style.color = "gray";
        li.appendChild(ghLink);
        listContainer.appendChild(li);
    });
});
`;

// const mainJsPath = path.join("main.js");
fs.writeFileSync(mainJs, mainJsContent);
console.log(`✅ "${mainJs}" was generated`);

const process = async function () {
  // gen docs folder if it doesn't exist
  if (!fs.existsSync(docsDir))
  {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // index.html for routing
  let indexHtml = fs.readFileSync("index.html", "utf8");
  const mainJsCode = fs.readFileSync(mainJs, "utf8");

  // Embed `main.js` into `index.html`
  indexHtml = indexHtml.replace(
    `<script type="module" src="./${mainJs}"></script>`,
    `<script type="module">\n${mainJsCode}\n</script>`
  );

  // Format HTML with prettier
  indexHtml = await prettier.format(indexHtml, { parser: "html" });

  // save routing HTML to docs
  fs.writeFileSync(path.join(docsDir, "index.html"), indexHtml);
  console.log("✅ `index.html` build complete");

  // embed `ex*.js` into `ex*.html` and save to `docs/`
  // const htmlFiles = glob.sync(`${devDir}/week*/ex*.html`);
  for (const htmlFile of exerciseFiles)
  {
    const jsFile = htmlFile.replace(".html", ".js");
    // const outputHtmlFile = path.join(docsDir, htmlFile.replace(`${devDir}/`, ""));
    const outputHtmlFile = `${docsDir}/${htmlFile.replace(`${devDir}/`, "")}`;


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
  const filesToDelete = [bundleJsPath, mainJs];

  filesToDelete.forEach((file) => {
    if (fs.existsSync(file))
    {
      fs.unlinkSync(file);
      console.log(`🗑️  delete: ${file}`);
    }
  });
}

process();
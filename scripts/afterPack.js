/**
 * electron-builder afterPack hook
 * 빌드 후 불필요한 파일을 제거하여 용량 최적화
 */
const fs = require("fs");
const path = require("path");

// 유지할 locale (한국어 + 영어 기본)
const KEEP_LOCALES = new Set(["ko.pak", "en-US.pak"]);

module.exports = async function (context) {
  const appDir = context.appOutDir;

  // 1. 불필요한 locale 제거 (42MB → ~2MB)
  const localesDir = path.join(appDir, "locales");
  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir);
    let removed = 0;
    for (const file of files) {
      if (!KEEP_LOCALES.has(file)) {
        fs.unlinkSync(path.join(localesDir, file));
        removed++;
      }
    }
    console.log(`  • locales 정리: ${removed}개 제거, ${KEEP_LOCALES.size}개 유지`);
  }

  // 2. 불필요한 대형 파일 제거
  const removeFiles = [
    "LICENSES.chromium.html",  // 12MB 라이선스 파일
  ];

  for (const name of removeFiles) {
    const fp = path.join(appDir, name);
    if (fs.existsSync(fp)) {
      const size = (fs.statSync(fp).size / 1024 / 1024).toFixed(1);
      fs.unlinkSync(fp);
      console.log(`  • ${name} 제거 (${size}MB)`);
    }
  }

  console.log("  • 용량 최적화 완료");
};

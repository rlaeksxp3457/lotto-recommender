const { execSync } = require('child_process');
const path = require('path');

exports.default = async function sign(config) {
  const filePath = config.path;

  // signtool.exe from the extracted winCodeSign cache or Windows SDK
  const signtoolPaths = [
    path.join(__dirname, '..', 'node_modules', 'app-builder-lib', 'node_modules', 'electron-builder-squirrel-windows', 'vendor', 'signtool.exe'),
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\signtool.exe',
  ];

  // Use the signtool from the pre-extracted winCodeSign cache
  const cacheBase = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign', 'winCodeSign-2.6.0', 'windows-10', 'x64');
  signtoolPaths.unshift(path.join(cacheBase, 'signtool.exe'));

  let signtool = null;
  const fs = require('fs');
  for (const p of signtoolPaths) {
    if (fs.existsSync(p)) {
      signtool = p;
      break;
    }
  }

  if (!signtool) {
    console.warn('signtool.exe not found, skipping signing for:', filePath);
    return;
  }

  const pfx = path.resolve(__dirname, '..', 'certs', 'code-signing.pfx');
  const password = 'lotto2025!';

  console.log(`Signing: ${path.basename(filePath)}`);
  try {
    execSync(
      `"${signtool}" sign /f "${pfx}" /p "${password}" /fd sha256 /tr http://timestamp.digicert.com /td sha256 "${filePath}"`,
      { stdio: 'pipe' }
    );
    console.log(`Signed: ${path.basename(filePath)}`);
  } catch (e) {
    // Timestamping might fail, try without timestamp
    try {
      execSync(
        `"${signtool}" sign /f "${pfx}" /p "${password}" /fd sha256 "${filePath}"`,
        { stdio: 'pipe' }
      );
      console.log(`Signed (no timestamp): ${path.basename(filePath)}`);
    } catch (e2) {
      console.warn(`Failed to sign ${path.basename(filePath)}: ${e2.message}`);
    }
  }
};

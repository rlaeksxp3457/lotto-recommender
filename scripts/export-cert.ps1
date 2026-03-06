$cert = Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Thumbprint -eq 'FF26DA2FABFBF48D9D3875F28D1EDE95B9E878CE' }
if (-not $cert) {
    Write-Host "Certificate not found, creating new one..."
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject 'CN=Lotto Recommender, O=rlaeksxp3457' -CertStoreLocation Cert:\CurrentUser\My -NotAfter (Get-Date).AddYears(5) -KeyUsage DigitalSignature -FriendlyName 'Lotto Recommender Code Signing'
}
Write-Host "Thumbprint: $($cert.Thumbprint)"
Write-Host "Subject: $($cert.Subject)"

$pwd = ConvertTo-SecureString -String 'lotto2025!' -Force -AsPlainText
New-Item -ItemType Directory -Path 'C:\Users\rlaek\lotto\certs' -Force | Out-Null
Export-PfxCertificate -Cert $cert -FilePath 'C:\Users\rlaek\lotto\certs\code-signing.pfx' -Password $pwd | Out-Null
Write-Host "Exported to certs\code-signing.pfx"

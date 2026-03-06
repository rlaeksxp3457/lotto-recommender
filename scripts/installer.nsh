!macro customInit
  ; Kill running app before install/update
  nsExec::ExecToLog 'taskkill /F /IM "로또 추천기.exe"'
  Sleep 1500

  ; Force remove old desktop shortcut (may be locked by Vanguard etc.)
  SetShellVarContext current
  Delete "$DESKTOP\로또 추천기.lnk"
  IfFileExists "$DESKTOP\로또 추천기.lnk" 0 +2
    System::Call 'kernel32::MoveFileExW(w "$DESKTOP\로또 추천기.lnk", w 0, i 4)'

  SetShellVarContext all
  Delete "$DESKTOP\로또 추천기.lnk"
  IfFileExists "$DESKTOP\로또 추천기.lnk" 0 +2
    System::Call 'kernel32::MoveFileExW(w "$DESKTOP\로또 추천기.lnk", w 0, i 4)'
!macroend

!macro customInstall
  ; 바탕화면 바로가기에 커스텀 아이콘 명시적 적용
  SetShellVarContext current
  IfFileExists "$DESKTOP\로또 추천기.lnk" 0 +2
    CreateShortCut "$DESKTOP\로또 추천기.lnk" "$appExe" "" "$INSTDIR\resources\assets\icon.ico" 0

  SetShellVarContext all
  IfFileExists "$DESKTOP\로또 추천기.lnk" 0 +2
    CreateShortCut "$DESKTOP\로또 추천기.lnk" "$appExe" "" "$INSTDIR\resources\assets\icon.ico" 0
!macroend

!macro customUnInit
  ; Kill running app before uninstall
  nsExec::ExecToLog 'taskkill /F /IM "로또 추천기.exe"'
  Sleep 1500

  ; Force remove desktop shortcut
  SetShellVarContext current
  Delete "$DESKTOP\로또 추천기.lnk"
  IfFileExists "$DESKTOP\로또 추천기.lnk" 0 +2
    System::Call 'kernel32::MoveFileExW(w "$DESKTOP\로또 추천기.lnk", w 0, i 4)'

  SetShellVarContext all
  Delete "$DESKTOP\로또 추천기.lnk"
  IfFileExists "$DESKTOP\로또 추천기.lnk" 0 +2
    System::Call 'kernel32::MoveFileExW(w "$DESKTOP\로또 추천기.lnk", w 0, i 4)'
!macroend

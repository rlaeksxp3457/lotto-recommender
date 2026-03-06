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
  ; 바탕화면 바로가기 강제 재생성 (업데이트 시에도 올바른 아이콘 적용)
  SetShellVarContext current
  CreateShortCut "$DESKTOP\로또 추천기.lnk" "$appExe" "" "$INSTDIR\resources\assets\icon.ico" 0

  ; Windows 아이콘 캐시 초기화
  nsExec::ExecToLog 'ie4uinit.exe -show'
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

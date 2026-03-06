!macro customInit
  ; Kill running app before install/update
  nsExec::ExecToLog 'taskkill /F /IM "로또 추천기.exe"'
  Sleep 1000
!macroend

!macro customUnInit
  ; Kill running app before uninstall
  nsExec::ExecToLog 'taskkill /F /IM "로또 추천기.exe"'
  Sleep 1000
!macroend

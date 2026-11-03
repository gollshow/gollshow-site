# 예전 사이트(Adobe Portfolio) 작품 가져오기

> **2026-11-03: 예전 사이트의 작품은 이미 모두 가져왔습니다** (회화 66, 콩테·파스텔 37, 디지털 13, 음악 링크, 소개). 자세한 결과: [`../round2-report.md`](../round2-report.md), [`../../IMPORT_REPORT.md`](../../IMPORT_REPORT.md).
> 아래 방법은 나중에 다른 페이지를 더 가져올 일이 있을 때만 쓰면 됩니다.

이 폴더에 예전 사이트의 페이지를 **HTML 파일로 저장해서 올리면**, 자동으로 작품이 만들어집니다.
(이미지는 Adobe 서버에서 가장 큰 크기로 내려받습니다. 제목·연도·설명은 원래 적힌 그대로 가져옵니다.)

1. 컴퓨터 브라우저로 예전 사이트를 엽니다. 예: https://gollshow.com/picture
2. **파일 → 다른 이름으로 페이지 저장** (Chrome: `Ctrl+S` / Mac `Cmd+S`) → 형식 **"웹페이지, HTML만"** 으로 저장.
   - 전시실 페이지(`/picture`, `/ttt`, `/contepastel`, `/digital`, `/music-1`)를 저장하고,
   - 그 안의 **각 작품 페이지**도 열어서 같은 방법으로 저장하면 모든 이미지와 설명까지 가져옵니다.
     (작품 페이지를 저장하지 않으면 전시실의 대표 이미지 한 장만 가져옵니다.)
3. GitHub에서 이 폴더(`_import/inbox`)를 열고 **Add file → Upload files** → 저장한 `.html` 파일들을 끌어다 놓기 → **Commit changes**.
4. 5~10분 뒤 사이트에 나타납니다. 결과는 `_import/last-run.md` 에 적힙니다.
   진행 상황: https://github.com/gollshow/gollshow-site/actions ("Import old site pages")

- 이미 있는 작품(같은 주소)은 덮어쓰지 않습니다.
- 제목이 없는 이미지는 제목 없이 **공개 작품**으로 들어옵니다 (사이트에는 "회화 017"처럼 릴 이름과 순서로 나옵니다). 제목을 지어 넣지 않습니다.
- 「귀행자」 관련 페이지는 자동으로 건너뜁니다.

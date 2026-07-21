# BerberiYt — Desktop

Aplikacioni desktop i [BerberiYt](https://berberiyt.com) për Windows dhe macOS.

Është një shell i hollë (Electron) rreth berberiyt.com: i njëjti sistem
rezervimesh dhe e njëjta llogari si në web, por si aplikacion i pavarur me
ikonë në desktop, dritare të vetën dhe kyçje që ruhet.

## Shkarko

**[berberiyt.com/shkarko](https://berberiyt.com/shkarko)** — ose direkt nga
[Releases](../../releases/latest).

## Zhvillim

```bash
npm install
npm start                        # hap aplikacionin
BERBERIYT_URL=http://localhost:3000 npm start   # kundrejt dev-serverit
```

## Ndërtim

```bash
npm run build:win    # dist/BerberiYt-Setup.exe   (kërkon Windows)
npm run build:mac    # dist/BerberiYt-Mac.dmg     (kërkon macOS)
```

Për të publikuar një version të ri, ngrit `version` në `package.json` dhe
shty një tag:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

GitHub Actions i ndërton të dy instaluesit dhe i bashkëngjit te Release-i.
Linqet `releases/latest/download/...` që përdor faqja mbeten të njëjta.

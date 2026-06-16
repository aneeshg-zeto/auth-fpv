# Contributing to next-webauthn

## Clone and run

```bash
git clone https://github.com/aneeshg-zeto/auth-fpv.git
cd next-webauthn
npm install
npm run dev -w demo
```

The demo app runs at `http://localhost:3000`.

## Branch naming

- `fix/` for bug fixes
- `feat/` for new features
- `docs/` for documentation
- `chore/` for maintenance

## PR process

1. Describe the problem and link to the related issue.
2. Run `npm run typecheck -w next-webauthn` before submitting.
3. Ensure zero code comments in `.ts` and `.tsx` files.
4. No browser storage (`localStorage`, `sessionStorage`, IndexedDB).
5. Test on macOS when possible — this project is optimized For Mac.

## Publishing

This project uses [changesets](https://github.com/changesets/changesets).

```bash
npx changeset
npx changeset version
npm run build -w next-webauthn
npm publish --workspace packages/next-webauthn
```

## Code style

- TypeScript strict mode
- No code comments
- No browser storage
- All cryptographic verification on the server
- Only HttpOnly, Secure, SameSite=Strict cookies in the browser

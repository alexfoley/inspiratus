# Palimpsest

> *A palimpsest is a manuscript with older writing hidden beneath the new.
> This one hides a note beneath an emoji.*

Pass secret notes with a friend — like folding a paper note into a textbook.
Write a note, pick an emoji, and Palimpsest hands you back an ordinary-looking
emoji (`😀`) that secretly carries your whole message. Your friend pastes it in
and reads it. It travels through normal chat apps as plain text.

No installation, no accounts, no server. Just open `index.html`.

## The two modes

The interface has two tabs, named after *The Tempest*:

- **Ariel** — the invisible spirit who carries messages unseen. Use Ariel to
  **hide** a note inside an emoji.
- **Prospero** — the one who commands Ariel and reads what he carries. Use
  Prospero to **reveal** a hidden note.

(The page itself never tells you which is which — that's half the fun. Friends
who don't know the trick have to work it out.)

## How it works

Unicode has 256 invisible "variation selector" characters. Palimpsest turns
your note into bytes, maps each byte to one invisible selector, and tucks them
all behind a single visible emoji. They render as nothing, so the emoji looks
completely ordinary — but Prospero can read them back.

## Shared secret (optional)

Set a passphrase on both sides and the note is scrambled so that even someone
who knows the emoji trick can't read it without your word.

**Honest caveat:** this is *passing-notes-in-class* strength — enough to foil a
curious classmate, **not** a determined adversary. It's obfuscation, not
encryption. Don't use it for anything that truly needs to stay secret.

## Will it survive my chat app?

Usually. Messengers like iMessage, WhatsApp, Signal, Discord, Slack, and email
preserve the hidden characters. A few platforms (some web forms, some social
networks) strip or normalize them. **Send yourself a test first** on whatever
channel you'll use.

## Run the tests

```bash
node --test          # codec unit tests (Node built-in, no dependencies)
```

Or open `tests.html` in a browser to watch the same checks run.

## License

MIT — see [LICENSE](LICENSE).

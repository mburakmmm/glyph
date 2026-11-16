# TODO — Glyph: NOX Advanced Template Engine

> **Kaynak Sözleşme:** [AGENTS.md](AGENTS.md)  
> **Hedef Dil & Doğrulanan Araç Zinciri:** `noxc 2.1.186` (`C:\Users\Administrator\.nox-lang\bin\noxc.exe`)  
> **Durum:** Faz 5 (`v0.3.0`) tamamlandı — Faz 6 (`v0.4.0`) sıradaki iş.  
> **Kural:** Hiçbir madde, gerçek `.nox` kodu `noxc check` ve `noxc test` ile çalıştırılıp kanıtlanmadan `[x]` işaretlenmez.

---

## Çalışma Kuralları ve Faz Geçiş Kapıları (Özet)

1. **Sıra:** `Spesifikasyon → Sınır/Tehdit Analizi → Minimal .nox Kod → Pozitif/Negatif/Güvenlik Testi → Performans Kontrolü → Dokümantasyon`.
2. **NOX Gerçekliği:** Bellekten veya Python'dan API/semantik uydurulmaz. Her stdlib/dil özelliği önce küçük bir `.nox` PoC ile kanıtlanır ve `docs/compatibility.md` dosyasında `verified | experimental | unavailable | planned` olarak işaretlenir.
3. **Bağımlılık Yönü:** `glyph/` (core) hiçbir web framework'ünü (`nyx`, `aether`, `aura`) import etmez. Adaptörler `integrations/` altında core'u import eder.
4. **Güvenlik Önceliği:** `güvenlik invariants > derlenen NOX gerçeği > belgelenmiş public contract > ADR > roadmap > öneri`.
5. **Faz Sonu Zorunluluğu:** Her faz/alt-görev sonunda `todo.md`, `docs/roadmap.md`, `CHANGELOG.md` ve ilgili ADR güncellenir; `AGENTS.md` §28 formatında raporlanır.

---

## Sürüm Takip Özeti

| Faz | Hedef Sürüm | Odak | Durum |
|---|---|---|---|
| Faz 0 | `v0.0.1-audit` | NOX 2.x capability audit, PoC'lar, repo iskeleti, ADR-0001 | `[x]` Tamamlandı |
| Faz 1 | `v0.0.2-core-lexer` | Typed `Value`, `SourceSpan`, `Errors`, `ResourceBudget`, `Lexer` | `[x]` Tamamlandı |
| Faz 2 | `v0.0.3-parser-ast` | Pratt expression parser, AST, statement nesting, static validation | `[x]` Tamamlandı |
| Faz 3 | `v0.1.0` **(MVP)** | AST interpreter, Writer, default HTML escape, limits, `MemoryLoader`, Slice #1 | `[x]` Tamamlandı |
| Faz 4 | `v0.2.0` | `FilesystemLoader` sandbox, `include`, `ParseCache`/`CompileCache`, dependency graph | `[x]` Tamamlandı |
| Faz 5 | `v0.3.0` | `extends`, `block`, `super()`, `macro`, `import`, `call/caller`, Slice #2 | `[x]` Tamamlandı |
| Faz 6 | `v0.4.0` | Contextual HTML escaping, URL/JS/CSS engeli, `TrustedMarkup`, security corpus | `[ ]` Başlanmadı |
| Faz 7 | `v0.5.0` | Tam Filter/Test/Function registry kataloğu, cost metering, `HelperContext` | `[ ]` Başlanmadı |
| Faz 8 | `v0.6.0` | i18n/locale/plural, çıkış profilleri (HTML/Text/XML/MD/JSON/Email), Streaming Writer | `[ ]` Başlanmadı |
| Faz 9 | `v0.7.0` | `integrations/nyx`, `integrations/aether`, `glyph` CLI, diagnostic JSON, Slice #3 | `[ ]` Başlanmadı |
| Faz 10 | `v1.0.0` **(STABLE)** | Fuzz, race/concurrency stress, benchmark, WASM, CI/provenance, **v1.0 Release Gate** | `[ ]` Başlanmadı |
| Faz 11 | `v1.1.0+` / `v2.0` | ADV (`with`, `filter` blok, component/slot, const-fold, LSP) & RESEARCH (AOT, multi-tenant) | `[ ]` Başlanmadı |

---

## Faz 0 — `v0.0.1-audit`: Feasibility & Gerçek NOX Capability Audit

**Amaç:** `noxc 2.1.186` üzerinde dil ve stdlib kabiliyetlerini varsayımsız kanıtlamak, paket/modül yapısını kilitlemek ve temel proje dokümanlarını kurmak.

### 0.1. Araç Zinciri ve Repo İskeleti
- [x] `noxc` araç zinciri profil/backend doğrulaması: `noxc --version` (`2.1.186`), `noxc check`, `noxc test`, `--backend llvm` vs `--backend qbe`, `--profile hosted` vs `--profile freestanding` (`--target wasm32-wasi` / `wasm32-freestanding` LLVM ile doğrulandı).
- [x] `nox.json` (`name: glyph`, `entry: glyph/api.nox`, `requires: []`) oluşturma; `noxc fetch` / `noxc update` / `noxc sbom` / `noxc sign check` doğrulandı (`requires` boşken `nox.lock` üretilmez).
- [x] Temel repo ve GitHub dosyalarını oluşturma: `README.md`, `LICENSE`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`, `.gitignore`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`.
- [x] Temel dokümantasyon dosyalarını oluşturma: `docs/ARCHITECTURE.md`, `docs/compatibility.md`, `docs/roadmap.md`.

### 0.2. Zorunlu `.nox` Proof-of-Concept (PoC) Doğrulamaları
Her PoC derlenip `noxc check` + `noxc test` ile doğrulanmış ve sonucu `docs/compatibility.md` içine işlenmiştir:
- [x] **PoC-1 (Modül/Paket Import & Consumer Build):** `glyph/api.nox` + `examples/audit_consumer/main.nox` `noxc check` ve `noxc run` ile doğrulandı.
- [x] **PoC-2 (Value & AST Temsili):** Recursive `enum Value` (`list[Value]`, `OrderedDict[str, Value]`) ve `match` kapsamlılığı doğrulandı (`tests/audit/audit_test.nox`).
- [x] **PoC-3 (`nox.json` & Sayısal Hassasiyet):** `JsonValue` (`nox.core` yerleşik tipi), `parse`, `as_int`, `number_text` (`9007199254740993`) doğrulandı.
- [x] **PoC-4 (Callback / Registry Dispatch):** First-class closure `(str) -> str` derlendi ve çalıştı.
- [x] **PoC-5 (Hata & Exception Modeli):** `Exception` alt sınıfları (`AuditSubError(AuditBaseError)`) ve base yakalama doğrulandı (`except` için unqualified `from ... import Err` gerektiği saptandı).
- [x] **PoC-6 (Strings, Unicode, Regex, Collections):** `nox.strings.byte_len` vs `len`, `nox.unicode.upper_tr`/`lower_tr`, `nox.regex.search`, `OrderedDict`/`LRUCache` doğrulandı.
- [x] **PoC-7 (Path & FS Sandbox):** `nox.path.safe_join` `..` reddi doğrulandı; mutlak `/` ve fiziksel yol sızdıran hata mesajı kısıtı `docs/compatibility.md`ye işlendi.
- [x] **PoC-8 (WASM & Concurrency Smoke):** `--profile freestanding` (`nox.unicode` hariç), `--target wasm32-freestanding` (`glyph/api.nox` + consumer `.wasm` build), `--strict-spawn-shared` doğrulandı.
- [ ] **PoC-9 (Nyx İncelemesi):** `nyx` (`>= 0.29.0`) canlı paket uyumu Faz 9'da `integrations/nyx` oluşturulurken doğrulanacak (core `glyph/` bağımsızlığı CI kuralıyla kilitlendi).

### 0.3. Karar & Kabul (Faz 0 Gate)
- [x] `docs/adr/0001-min-nox-version-and-value-repr.md` (**ADR-0001**) yazımı.
- [x] `tests/audit/audit_test.nox` dosyasının `noxc test` ile yeşil geçmesi (`1 passed, 0 failed`).
- [x] Consumer örneğinin (`examples/audit_consumer/main.nox`) `noxc run` ile derlenip çalışması.

---

## Faz 1 — `v0.0.2-core-lexer`: Value Sistemi, Hata/Bütçe Çekirdeği ve Lexer

**Amaç:** Template motorunun deterministik veri modelini, hata/span altyapısını, kaynak bütçesi iskeletini ve O(n) güvenli tarayıcısını üretmek.

### 1.1. Çekirdek Tipler ve Bütçe (`glyph/version.nox`, `errors.nox`, `limits.nox`)
- [x] `glyph/version.nox`: Engine sürüm sabitleri (`GLYPH_VERSION = "0.0.2-core-lexer"`).
- [x] `glyph/errors.nox`: `SourceSpan` (`logical_name`, `line`, `column`, `byte_start`, `byte_end`), `RelatedSpan`, stable error kodları (`GLYPH_SYNTAX_*`, `GLYPH_EVAL_*`, `GLYPH_SECURITY_*`, `GLYPH_LIMIT_*`, `GLYPH_LOADER_*`, `GLYPH_RENDER_*`), `GlyphError` tipleri ve redaction politikası (`redact_logical_name`, `format_public_error`).
- [x] `glyph/limits.nox`: `ResourceBudget` (`default_budget()`, `restricted_budget()`) ve alt render'da resetlenemeyen paylaşılan `BudgetTracker`.

### 1.2. Tipli Value Modeli (`glyph/value.nox`)
- [x] `Value` varyantları: `VNull`, `VUndefined`, `VBool`, `VInt`, `VFloat`, `VStr`, `VList`, `VMap` (`OrderedDict`), `VTrustedMarkup` (bağlam etiketli), `VCallable`.
- [x] `JsonValue -> Value` dönüşümü (`from_json` / `from_json_str`, `as_int` / `number_text` hassasiyet korumalı, JSON asla `VTrustedMarkup` olmaz).
- [x] Açık `stringify`, `truthiness` tablosu, `StrictUndefined` vs `LenientUndefined`, NaN/Infinity reddi ve overflow-checked tamsayı aritmetiği.
- [x] Güvenlik kuralı: `__*`, `constructor`, `prototype` lookup reddi (`GlyphSecurityError`).

### 1.3. Token ve Lexer (`glyph/token.nox`, `glyph/lexer.nox`)
- [x] Delimiter tarama: `{{ ... }}`, `{% ... %}`, `{# ... #}`, `{% raw %}...{% endraw %}`.
- [x] Whitespace trim kontrolleri: `{{-`, `-}}`, `{%-`, `-%}`, `{#-`, `-#}` (CRLF ve Unicode line/col takibi ile).
- [x] String literal, escape dizileri (`\"`, `\'`, `\\`, `\n`, `\t`, `\r`), int/float literaller, operatör ve noktalama tokenları.
- [x] String/comment/raw içinde yanlış delimiter algılamama; nested `raw` reddi; RFC 3629 UTF-8 doğrulaması; kapanmayan delimiter'da kesin line/col hata raporu.
- [x] O(n) tek geçişli tarama + `max_source_bytes` / `max_tokens` / `max_token_bytes` limitleri.

### 1.4. Faz 1 Testleri ve Kabul
- [x] `tests/value/value_test.nox`: JSON -> Value, NaN/Inf, 64-bit int, truthiness, `Undefined != Null`, reflection reddi, overflow ve budget testleri.
- [x] `tests/lexer/lexer_test.nox`: Token/span golden kontrolleri, CRLF/UTF-8 byte-line-col testleri, string içi `}}` çarpışma testleri, malformed UTF-8 & kapanmayan blok negatif testleri.
- [x] 200 deterministik rastgele girdiyle lexer fuzz-smoke testi (`tests/lexer/lexer_test.nox`).

---

## Faz 2 — `v0.0.3-parser-ast`: Parser, Expression Dili ve Statik Doğrulama

**Amaç:** Güvenli expression gramerini, AST yapısını, kontrol bloklarını ve çalışma öncesi statik doğrulamayı tamamlamak.

### 2.1. Spesifikasyon ve ADR
- [x] `docs/adr/0002-expression-grammar-and-truthiness.md` (**ADR-0002**): Pratt precedence tablosu, `is [not]` bağlanması, `in`/`not in`, ternary `a if cond else b`, truthiness ve tip hata kuralları.
- [x] `docs/syntax.md` ve `docs/expressions.md` ilk kararlı taslakları.

### 2.2. AST ve Expression Modelleri (`glyph/ast.nox`, `glyph/expressions.nox`)
- [x] Immutable AST düğümleri + `SourceSpan`: `SText`, `SOutput`, `SIf`, `SFor`, `SSet`, `SInclude`, `SExtends`, `SBlock`, `SMacro`, `SImport`, `SFromImport`, `SCallBlock`.
- [x] Expression AST düğümleri: `ENull`, `EBool`, `EInt`, `EFloat`, `EStr`, `EIdent`, `EList`, `EMap`, `EMember` (`.field`), `EIndex` (`[expr]`), `EUnary`, `EBinary`, `EConditional`, `EFilter`, `EIsTest`, `ECall`.

### 2.3. İki Aşamalı Parser (`glyph/parser.nox`)
- [x] Statement nesting parser: `if / elif / else / endif`, `for / else / endfor` (tek ve iki değişken unpack), `set name = expr` ve composition etiketleri.
- [x] Pratt / precedence-climbing expression parser (whitelist gramer, chained comparison reddi, method call / reflection reddi).
- [x] `max_ast_nodes` ve `max_expr_depth` limitleri; hatalı iç içe bloklarda deterministic hata önceliği.
- [x] Lint modu için `lint_tokens` diagnostic tarayıcısı (render'da asla düzeltilmiş/sahte AST yürütülmez).

### 2.4. Statik Doğrulama (`glyph/validate.nox`)
- [x] Bilinmeyen tag/ifade yapısı, yasak anahtar/özellik (`__*`, `constructor`, `prototype`), `extends` top-level kuralı, `super()` ve duplicate block kontrolleri.
- [x] `TemplateInfo` çıkarımı (referans alınan harici değişkenler, bloklar, include/import bağımlılıkları, makrolar).

### 2.5. Faz 2 Testleri ve Kabul
- [x] `tests/parser/parser_test.nox`: tüm AST node ve precedence testleri, `max_expr_depth` / `max_ast_nodes` taşma testleri, yanlış nesting negatif testleri.
- [x] `tests/expression/expression_test.nox`: scope/TemplateInfo analizi, argüman/parametre doğrulaması, reflection/method-call engelleme testleri.

---

## Faz 3 — `v0.1.0` (MVP): Render Motoru, Temel HTML Safety ve MemoryLoader

**Amaç:** `AGENTS.md` §29'daki ilk vertical slice'ı güvenli, bütçeli ve yeniden kullanılabilir şekilde çalışan ilk yayınlanabilir MVP (`v0.1.0`) haline getirmek.

### 3.1. Scope, Context ve Writer (`glyph/options.nox`, `glyph/scope.nox`, `glyph/writer.nox`)
- [x] `glyph/options.nox`: `EnvironmentOptions` (`html_safe_defaults()`, `text_safe_defaults()`, `restricted_defaults()`), `RenderOptions`, `OutputMode`, `TrustTier` (`min_trust_tier`).
- [x] `glyph/scope.nox`: `Context`, `RenderScope` (lexical child frame stack, parent mutate edilemez, `set` sadece yerel scope'a yazar), `loop` metadata (`index`, `index0`, `first`, `last`, `length`, `revindex`, `revindex0`).
- [x] `glyph/writer.nox`: `GlyphWriter` ve `RenderResult` (chunked `list[str]` + `nox.strings.join`, `max_output_bytes` kontrolü, `close()`).

### 3.2. Temel Güvenlik ve Built-in'ler (`glyph/safety.nox`, `filters.nox`, `tests_registry.nox`, `functions.nox`)
- [x] `glyph/safety.nox`: Varsayılan `autoescape=ON`, O(n) `escape_html` + NUL byte reddi, context-tagged `VTrustedMarkup`; untrusted modda `|safe` kapalı.
- [x] MVP built-in filtreler: `escape`/`e`, `default`, `length`, `join`, `upper`, `lower`, policy-gated `safe` ve custom `FilterRegistry.register(...)`.
- [x] MVP built-in test & fonksiyonlar: `defined`, `undefined`, `none`/`null`, `empty`, type testleri, bounded `range()` (`MAX_RANGE_ITEMS = 10000` + budget).

### 3.3. MemoryLoader, Runtime ve Public API (`glyph/loader.nox`, `loader_memory.nox`, `runtime.nox`, `environment.nox`, `api.nox`)
- [x] `glyph/loader.nox` & `glyph/loader_memory.nox`: `SourceRecord` ve salt-okunur bellek içi `MemoryLoader`.
- [x] `glyph/runtime.nox`: AST interpreter (`Text`, `Output`, `If/Elif/Else`, `For/Else`, `Set`, short-circuit `and`/`or`/ternary, `TrustTier` floor, shared `BudgetTracker`).
- [x] `glyph/environment.nox` & `glyph/api.nox`: `Environment`, `Template`, `compile_string`, `get_template`, `render`, `render_with_options`, `render_to_writer`, `lint`, `inspect`, `escape_html`.

### 3.4. MVP Kabul Kapısı (`v0.1.0`)
- [x] **Vertical Slice #1 (`AGENTS.md` §29):** `title="<Welcome>"` ve `item.name="<script>alert(1)</script>"` ile `examples/hello/main.nox` ve `tests/rendering/render_test.nox` doğrulaması.
- [x] Eşzamanlı/ardışık render izolasyon testi (`test_reusable_template_and_scope_isolation`).
- [x] XSS baseline testleri, NUL reddi, `|safe` policy ve `ResourceBudget` aşım testleri (`tests/security/mvp_security_test.nox`).
- [x] `examples/hello/main.nox` oluşturuldu ve `noxc run` ile çalıştırıldı.
- [x] `docs/api.md` (v0.1.0 yüzeyi), `docs/roadmap.md`, `CHANGELOG.md` (`v0.1.0`) güncellendi.

---

## Faz 4 — `v0.2.0`: Loaders, Include ve Compile Cache

**Amaç:** Güvenli dosya sistemi şablon yüklemeyi, şablonlar arası `include` bileşimini ve politika-izoleli derleme önbelleğini eklemek.

### 4.1. Karar Kayıtları
- [x] `docs/adr/0005-loader-root-and-fs-toctou.md` (**ADR-0005**): Canonical root zorunluluğu, `nox.path.safe_join` + açma sonrası doğrulama, TOCTOU sınırlarının belgelenmesi.
- [x] `docs/adr/0007-cache-invalidation-and-isolation.md` (**ADR-0007**): Composite cache key, atomic replace, tenant/policy/locale izolasyonu.

### 4.2. Güvenli Loader Sistemi (`glyph/loader_fs.nox` + composite loader'lar)
- [x] `FilesystemLoader`: İzinli canonical root kilidi; mutlak yol, `.`, `..`, `%2e%2e`, NUL, drive-letter, Windows UNC, karışık `/` ve `\`, sibling-prefix (`/app/tpl` vs `/app/tpl_secret`) ve symlink escape engelleme.
- [x] `ChoiceLoader` ve `PrefixLoader`: Trust zone karıştırmadan açık sıralı çözümleme (yetki hatasında başka root'a fallback yok).
- [x] Public hatalarda fiziksel disk yolunun gizlenmesi (`logical_name` ve anonimleştirilmiş `root_tag` raporlama).

### 4.3. `include` Semantiği ve Cycle Tespiti
- [x] `{% include "partial.html" %}` literal ad zorunluluğu (dinamik ad yalnızca trusted-template policy + `allow_dynamic_include` ile).
- [x] `with context` / `without context` desteği; `ignore missing` yalnızca literal ad ve izinli politikada.
- [x] Paylaşılan `max_include_depth` bütçesi ve döngüsel include tespiti (`GLYPH_RENDER_CYCLE`).

### 4.4. Cache ve Dependency Graph (`glyph/cache.nox`)
- [x] `ParseCache` ve `CompileCache`: Anahtar bileşenleri = `origin_id + fingerprint + mode/autoescape/policy + engine_version + registry_generation + locale`.
- [x] Dependency graph takibi: Bağımlı partial (geçişli dahil) değiştiğinde üst şablonun invalidate edilmesi.
- [x] Bounded cache (`LRUCache` max entries / max bytes) ve immutable compile artifact paylaşımı.

### 4.5. Faz 4 Testleri ve Kabul (`v0.2.0`)
- [x] `docs/loaders.md` dokümantasyonu.
- [x] `tests/loaders/loader_test.nox`: Path traversal, sibling-prefix, UNC/drive-letter, include semantics, cycle ve trust floor testleri.
- [x] `tests/cache/cache_test.nox`: Kaynak güncelleme invalidation, policy/autoescape/trust/locale değişiminde cache ayrımı (sıfır sızıntı) ve LRU eviction testleri.

---

## Faz 5 — `v0.3.0`: Inheritance, Blocks ve Makro Sistemi

**Amaç:** Şablon kalıtımı (`extends`/`block`/`super`) ve yeniden kullanılabilir, kapsam-izoleli makroları üretmek.

### 5.1. Karar Kaydı
- [x] `docs/adr/0006-macro-scope-caller-and-includes.md` (**ADR-0006**): Macro closure yakalama kuralları, `call/caller` reentrancy modeli ve `include` varsayılan context politikası.

### 5.2. Kalıtım (`glyph/inheritance.nox`)
- [x] `{% extends "base.html" %}` yalnızca top-level konumda; cross-root inheritance engeli; security policy devralımı (`min_trust_tier`).
- [x] `{% block name %}...{% endblock %}` override çözümleme zinciri; `{{ super() }}` ile üst blok render'ı (parent yoksa deterministik hata).
- [x] Duplicate block, missing parent/block ve inheritance cycle (`A -> B -> A`) hataları.

### 5.3. Makrolar ve İçe Aktarma (`glyph/macros.nox`)
- [x] `{% macro name(a, b=default) %}...{% endmacro %}`: Positional, keyword ve default argümanlar; arity/duplicate/unknown keyword hata kontrolü.
- [x] `{% import "helpers.html" as h %}` ve `{% from "helpers.html" import x %}`: Immutable namespace, `_macro` gizliliği, circular import tespiti (`parser.nox` yalnız import alias'larında `h.macro()` izni).
- [x] `{% call macro(...) %}...{% endcall %}` ve `caller()` callback desteği (bounded depth).
- [x] Güvenlik kuralı: Macro çıktı fragmanında güven etiketi korunur; `Restricted`/untrusted makro sonucu otomatik `TrustedMarkup` olmaz.

### 5.4. Faz 5 Testleri ve Kabul (`v0.3.0`)
- [x] **Vertical Slice #2:** `examples/blog_layout/main.nox` (`base.html` + `extends` + `block` + `super()` + `include` + `macro` + `import` + `call/caller`) `noxc run` ile doğrulandı.
- [x] `tests/composition/composition_test.nox`: Çok katmanlı kalıtım, cycle, `super()` hataları, macro recursive budget aşımı, kapsam izolasyonu ve `extends`/`import` cache invalidation testleri.

---

## Faz 6 — `v0.4.0`: Contextual Escaping, Trust Model ve Güvenlik Kapısı

**Amaç:** `AGENTS.md` §10'daki tüm bağlamsal XSS korumalarını, güven etiketlerini, URL/JS/CSS politikalarını ve saldırı test kümesini tamamlamak.

### 6.1. Karar Kayıtları ve Dokümanlar
- [ ] `docs/adr/0003-contextual-html-escaping.md` (**ADR-0003**)
- [ ] `docs/adr/0004-trusted-markup-and-safe-policy.md` (**ADR-0004**)
- [ ] `docs/adr/0012-user-created-templates-threat-model.md` (**ADR-0012**)
- [ ] `docs/security.md` ve `SECURITY.md` güncellemesi (threat model: Trusted / Restricted / Untrusted templates).

### 6.2. Bağlamsal HTML Tracker ve Güven Etiketleri
- [ ] `OutputContext` durum makinesi / minimal HTML tokenizer:
  - `HtmlText`, `HtmlAttributeQuoted` (izinli)
  - `HtmlAttributeUnquoted` (varsayılan reddedilir)
  - `HtmlUrlAttribute` (`href`, `src`, `action`, `formaction`, `srcset` — scheme allowlist: `http`, `https`, `mailto`, `tel`, relative; `javascript:`, `vbscript:`, `data:`, whitespace/percent/entity bypass reddi)
  - `HtmlJs` / `HtmlEventHandler` (`<script>`, `on*` — untrusted interpolasyon reddi)
  - `HtmlCss` / `StyleAttribute` (untrusted interpolasyon reddi)
  - `HtmlTagOrAttrName` (dinamik tag/attr adı reddi)
  - `Unknown` (fail-closed)
- [ ] `TrustedMarkup` ayrımı: `SafeHtml`, `SafeAttr`, `SafeUrl`, `SafeJs` — bağlamlar arası otomatik geçiş yok (`SafeHtml` attribute/URL/JS içinde güvenli sayılmaz).
- [ ] Concat/split kuralı: Trusted değer untrusted string ile birleşince güven etiketi düşer.
- [ ] `|tojson`: `<`, `>`, `&`, `U+2028`, `U+2029` ve `</script` kaçış sözleşmesi.
- [ ] Trust tier birleştirme: Parent/child şablonlarda **en kısıtlayıcı policy** kazanır; template içi `|safe`/`raw`/`autoescape false` untrusted modda yasak.

### 6.3. Zorunlu Güvenlik Test Kümesi (`tests/security/`)
- [ ] HTML text/attr quote bypass, malformed delimiter, NUL, entity/double-encoding, SVG/MathML payload'ları.
- [ ] `<script>`, `</script>`, `onerror`, `style`, `srcdoc`, dinamik tag/attribute enjeksiyon denemeleri.
- [ ] Case/whitespace/percent-encoded/HTML-entity-encoded `javascript:` URL bypass corpus'u.
- [ ] `SafeHtml`'in URL/JS/attr'e taşınması ve macro/include sırasında trust düşüşü testleri.
- [ ] Expression üzerinden `__class__`, `__dict__`, `constructor`, `prototype`, host method erişim denemeleri.
- [ ] Hata mesajlarında context değeri / secret / absolute path redaction testleri.

---

## Faz 7 — `v0.5.0`: Tam Built-in Filter/Test Kataloğu ve Genişletilebilirlik

**Amaç:** `AGENTS.md` §13 kapsamındaki onaylı tüm built-in filtre, test ve helper sözleşmelerini tam tip/bütçe/güvenlik denetimiyle sunmak.

### 7.1. Registry Sözleşmesi (`glyph/filters.nox`, `tests_registry.nox`, `functions.nox`)
- [ ] `FilterSpec`, `TestSpec`, `FunctionSpec`: `namespace/name`, `arity/range`, beklenen/dönen `Value` tipleri, `pure/deterministic`, `allowed_contexts`, `needs_locale`, `cost_class`, `maximum_expansion`, `policy_requirement`.
- [ ] `HelperContext` izolasyonu (tam `RenderContext` yerine locale + immutable config + shared budget + diagnostics).
- [ ] Core güvenlik helper'larının override edilmesini yasaklama; render başladıktan sonra registry mutasyon yasağı; `registry_generation` artışı.

### 7.2. Onaylı Built-in Filtreler ve Testler
- [ ] **Strings:** `upper`, `lower`, `capitalize`, `title`, `trim`, `replace`, `truncate`, `wordcount`, `indent`, `center`, `pad`, `striptags` (sanitizer değil uyarısı ile), `normalize_unicode`, `urlencode`, `slugify`.
- [ ] **Escaping:** `escape`, `forceescape`, `tojson`, `urlencode`, `xml_escape` (ve policy kontrollü `safe`).
- [ ] **Collections:** `length`, `first`, `last`, `reverse`, `sort` (heterojen türlerde açık comparator/hata), `unique`, `join`, `map(attribute=...)`, `select`, `reject`, `batch`, `slice`, `sum`, `min`, `max`, `groupby`, `dictsort`.
- [ ] **Numbers / Dates / Markdown:** `abs`, `round`, `int`, `float`, `number`, `currency`, `percent`, `filesize`, `default`, `string`; `date`, `datetime`, `relative_time` (explicit reference time); `md_escape`.
- [ ] **Tests (`is`):** `defined`, `undefined`, `none`, `boolean`, `number`, `integer`, `float`, `string`, `sequence`, `mapping`, `iterable`, `empty`, `equalto`, `odd`, `even`, `divisibleby`, `in`, `escaped`, `safe_for`.

### 7.3. Faz 7 Testleri ve Dokümantasyon (`v0.5.0`)
- [ ] `docs/filters.md`: Tüm built-in filtre/test imzaları, maliyet sınıfları ve güvenlik sınırları.
- [ ] Her filtre ve test için pozitif, tip hatası, boş/sınır değer, expansion/budget aşımı ve locale testi.

---

## Faz 8 — `v0.6.0`: i18n, Çıktı Profilleri ve Streaming Writer

**Amaç:** Deterministik çok-dillilik, HTML dışındaki resmi çıktı modları ve büyük çıktılar için akışlı writer protokolünü tamamlamak.

### 8.1. Karar Kayıtları
- [ ] `docs/adr/0008-streaming-writer-and-partial-errors.md` (**ADR-0008**)
- [ ] `docs/adr/0009-locale-catalog-and-plural-format.md` (**ADR-0009**)

### 8.2. i18n ve Locale (`glyph/locale.nox`, `glyph/catalog.nox`)
- [ ] `RenderOptions.locale` üzerinden explicit locale seçimi (process-global locale/timezone okuma yok).
- [ ] Read-only translation catalog adapter'ı + catalog sürümünün cache key'e dahil edilmesi.
- [ ] Locale fallback zinciri (`tr-TR -> tr -> default`), `strict` / fallback missing policy.
- [ ] `trans` / `plural` (veriye bağlı kural seti) ve interpolated parametrelerin mevcut çıktı bağlamında escape edilmesi.
- [ ] Türkçe casing (`nox.unicode.upper_tr` / `lower_tr`) ve belgeli deterministik date/number/currency alt kümesi.

### 8.3. Çıktı Profilleri (`AGENTS.md` §15)
- [ ] `OutputMode.Html` (default)
- [ ] `OutputMode.Text` (PlainText — escape kapalı, resource/policy kuralları aktif)
- [ ] `OutputMode.Xml` (XML text/attr escape + illegal XML karakter reddi + dinamik tag/attr yasağı)
- [ ] `OutputMode.Markdown` (literal üretimi + `md_escape` sınırları belgeli)
- [ ] `OutputMode.Json` / inline JSON embedding guard'ları
- [ ] Email profil desteği (HTML + plain-text çifti, subject CR/LF header injection koruması) + `examples/email/`.

### 8.4. Streaming Writer ve İptal
- [ ] `GlyphWriter` chunk/batch flush, backpressure dönüşleri, cancellation (`GlyphCancelledError`), no double-close garantisi.
- [ ] 16 MiB çıktı sınırı stres testi ve streamed vs buffered çıktı birebir denklik testi.

---

## Faz 9 — `v0.7.0`: Ekosistem Entegrasyonları (Nyx, Aether) ve CLI / Tooling

**Amaç:** Core'u kirletmeden framework adaptörlerini ve geliştirici CLI aracını (`glyph`) yayınlamak.

### 9.1. Karar Kaydı
- [ ] `docs/adr/0010-nyx-adapter-and-migration-rules.md` (**ADR-0010**)

### 9.2. Framework Adaptörleri (`integrations/`)
- [ ] `integrations/nyx/`: Opt-in `glyph_nyx.render_view(...)`; mevcut `nyx.view.render` davranışı değişmez; HTTP `Content-Type`, status, CSP nonce ve streaming preflight Nyx tarafında yönetilir.
- [ ] `integrations/aether/`: `text/html`, `text/plain`, `application/xml` content-negotiation adaptörü (JSON API için `nox.json` kullanımı korunur).
- [ ] `docs/integration-nyx.md`, `docs/integration-aether.md`, `examples/nyx/`, `examples/aether/`.
- [ ] Doğrulama: `glyph/` çekirdeğinin `integrations/` veya `nyx`/`aether` import etmediğinin statik kontrolü.

### 9.3. Diagnostics ve CLI (`glyph/diagnostics.nox`, `cli/main.nox`)
- [ ] `nox.json` `bin` desteği ve gerekiyorsa `Rune` uyumu doğrulaması.
- [ ] Alt komutlar: `glyph check`, `glyph lint`, `glyph render` (sadece JSON `--context`), `glyph inspect`, `glyph deps`, `glyph bench`, `glyph version`.
- [ ] `--format human|json`, stdout/stderr ayrımı, secret redaction uyarıları ve kararlı çıkış kodları (`0 OK`, `2 usage`, `3 syntax`, `4 loader`, `5 security`, `6 resource`, `7 runtime`, `8 internal`).
- [ ] **Vertical Slice #3:** Malicious URL/context injection reddeden SSR view + Nyx adaptörü + streaming writer + CLI smoke testi (`tests/integration/`).

---

## Faz 10 — `v1.0.0` (STABLE): Üretim Sertleştirmesi ve v1.0 Release Gate

**Amaç:** `AGENTS.md` §21, §22, §23 ve §27'deki tüm kalite, güvenlik, performans ve çapraz platform kapılarını kanıtlı biçimde geçerek `v1.0.0` yayımlamak.

### 10.1. İleri Doğrulama: Property, Fuzz, Mutation, Concurrency
- [ ] **Property-based & Roundtrip:** Rastgele geçerli AST -> serialize -> parse -> render denkliği; escaper idempotence/double-escape testleri.
- [ ] **Differential Reference Semantics:** Expression AST evaluator vs projedeki küçük trusted reference evaluator karşılaştırması.
- [ ] **Fuzzing (`tests/fuzz/`):** Arbitrary bytes -> lexer/parser (panic/hang/OOM yok, budget enforced).
- [ ] **Mutation Testleri:** Parser ve security mutantlarının mevcut test paketi tarafından yakalandığının kanıtlanması.
- [ ] **Concurrency & Stress:** 1/4/16/64 eşzamanlı render, cache stampede/eviction stresi, `--strict-spawn-shared` doğrulaması, sızıntı/OOM kontrolü.

### 10.2. Benchmark ve Performans (`benchmarks/`, `docs/performance.md`)
- [ ] Tekrar üretilebilir benchmark scriptleri (AGENTS §22 tablosu: küçük template, 10/1K/100K döngü, 3/10 kat inheritance, nested include/macro, contextual escape yükü, cold/warm cache, 1KB/1MB/16MB writer).
- [ ] O(n²) string construction regresyon testleri (büyük döngüde lineer davranış).
- [ ] `nox.template` ile baseline karşılaştırması (3+ bağımsız koşu, pinned `noxc` sürümü ve donanım/OS kaydı ile).

### 10.3. Cross-Platform, WASM, CI ve Paketleme
- [ ] Platform & backend matrisi: Windows x64, Linux x64, macOS arm64; `--backend llvm` ve `--backend qbe`.
- [ ] WASM hedefi: `examples/wasm_memory/` (`MemoryLoader` + sıkı limits, FS varsayımı olmadan) derleme ve boyut/bellek raporu.
- [ ] `examples/static_site/` oluşturma ve `noxc run` doğrulaması.
- [ ] `.github/workflows/`: `noxc check`, `noxc test`, security suite, fuzz smoke, consumer package build, examples, benchmark nightly, `noxc sign`/`sbom` (desteklenen akışla) ve release provenance.

### 10.4. v1.0.0 Release Gate (AGENTS.md §27 — Eksiksiz Onay)
- [ ] Public API kararlılık etiketleri (`Stable`, `Experimental`, `Deprecated`, `Internal`) ve SemVer/deprecation politikası (`docs/api.md`).
- [ ] Tüm dokümanlar tamam: `README`, `ARCHITECTURE`, `compatibility`, `syntax`, `expressions`, `security`, `api`, `filters`, `loaders`, `integration-nyx`, `integration-aether`, `performance`, `testing`, `roadmap`, `CHANGELOG`, `LICENSE`, `SECURITY`.
- [ ] Güvenlik corpus'u %100 yeşil; sıfır kritik/triajlanmamış güvenlik açığı.
- [ ] Tüm core/example/consumer/integration testleri `noxc check` ve `noxc test` ile son düzenlemeden sonra geçmiş.

---

## Faz 11 — `v1.1.0+` / `v2.0`: İleri Özellikler (ADV) ve Araştırma (RESEARCH)

> Not: Bu faz `v1.0.0` önkoşulu değildir. Her madde için ayrı ADR, güvenlik modeli, compatibility proof ve benchmark gerekir.

### 11.1. Advanced (`v1.x`)
- [ ] `{% with x = expr %}...{% endwith %}` ve `{% filter name %}...{% endfilter %}` blokları.
- [ ] Namespace modülleri ve `PackageLoader` / read-only `DatabaseLoader` adaptör örnekleri.
- [ ] Component / slot DSL (`{% component %}...{% slot %}`) — yalnızca macro+block karşılaştırmalı ADR sonrası, SSR HTML odaklı (Aura widget'ı değil).
- [ ] Yan etkisiz ifadelerde sabit katlama (constant folding) + diferansiyel (optimize vs non-optimize) doğrulama testleri.
- [ ] Geliştirici araçları: Source-map, editor grammar (tree-sitter), opsiyonel LSP entegrasyonu.
- [ ] Ekosistem hook'ları: `integrations/aura_export/` (e-posta/HTML export), `Obsidian` redacted log sink, `Pulse` trace/metrics hook'ları.

### 11.2. Research (`v2.0` Adayları)
- [ ] Async writer / platform-bağımlı async cancellation araştırması.
- [ ] **ADR-0011:** Ahead-of-Time (AOT) template -> typed NOX source code generation fizibilitesi (compiler yaması olmadan).
- [ ] **ADR-0012 Uygulaması:** Hostile multi-tenant ortamda kullanıcı kaynaklı template çalıştırma (WASM / ayrı process host izolasyonu ile).

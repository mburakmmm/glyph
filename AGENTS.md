# AGENTS.md — Glyph: NOX Advanced Template Engine

> **Durum:** Bağlayıcı proje geliştirme sözleşmesi / uygulama planı.  
> **Dil:** NOX (Nox 2.x). **Hedef:** Bağımsız, güvenli, tipli, genişletilebilir ve üretim ortamına uygun şablon motoru.  
> **İlk oluşturulma:** 2026-11-16.  
> **Ayrım:** Bu dosyadaki API'ler ve özellikler **Glyph için tasarım/hedeftir**; mevcut implementasyon oldukları iddia edilmez.

## 0. AI ajanları için çalışma protokolü

Bu dosya Glyph deposunun kökünde durur ve tüm kodlama ajanları, PR'lar, otomatik üretimler ve refaktörler için bağlayıcıdır.

1. Göreve başlamadan `AGENTS.md`, `README.md`, `nox.json`, `nox.lock`, `docs/ARCHITECTURE.md`, `docs/compatibility.md`, `docs/adr/`, `docs/roadmap.md` ve ilgili mevcut testleri oku. Dosya yoksa gereken en küçük sürümünü oluştur; varmış gibi davranma.
2. `noxc --version`, `noxc --help`, `noxc check`, `noxc test` ile gerçek araç zincirini doğrula. Repo içinde bulunan NOX kaynaklarının gerçek imzaları ve kurulu compiler her zaman öneri metninden üstündür.
3. Her dış API/stdlib yeteneğini **verified**, **experimental**, **unavailable** veya **planned** olarak `docs/compatibility.md` içinde işaretle. Bellekten ya da Python davranışından API uydurma.
4. Küçük bir çalışan `.nox` proof-of-concept oluşturmadan yeni sentaks, FFI, closure, generic, `JsonValue`, iterator veya plugin kabiliyetine bağımlı mimari değişiklik yapma.
5. Bir geliştirme birimi: **spesifikasyon → sınır/tehdit analizi → minimal kod → pozitif/negatif test → performans kontrolü → dokümantasyon**. Devasa tek seferlik implementasyonlardan kaçın.
6. Her adımda hangi dosyaların değiştiğini, neden değiştiğini, hangi testlerin gerçekten çalıştırıldığını ve kalan riskleri belirt. Test çalıştırılmadıysa 'geçti' deme.
7. Derleyici özelliği eksikse önce mevcut NOX sözdizimiyle eşdeğer çözümü dene. NOX compiler, runtime veya stdlib depolarını bu projede kendiliğinden değiştirme; bloke edici eksik için küçük reprodüksiyon ve ayrı upstream issue üret.
8. Güvenlik invariant'ı ihlal eden kısa yol, isteği hızlandırsa bile kabul edilemez. Hata güvenli şekilde durdurulur, kapsam ve alternatif raporlanır.
9. Bir görev sonunda `docs/roadmap.md`, test matrisi, varsa ADR ve `CHANGELOG.md` güncellenir. Tamamlanmamış maddeler tamamlanmış gibi işaretlenmez.
10. Kök dizindeki `AGENTS.md` temel kaynaktır. İç içe `AGENTS.md` dosyaları yalnızca klasöre özgü ayrıntı ekler; güvenlik ve mimari kuralları gevşetmez.

### 0.1. Gerçek NOX kabiliyetleri: doğrulanmış başlangıç noktası

16.11.2026'da NOX'un GitHub deposundaki belgeleri incelendi. Uygulamadan önce, kilitlenen compiler sürümünde yeniden kanıtlanmalıdır:

- Nox statik tipli, AOT derlenen, Python benzeri sözdizimli bir dil. `Any` veya çalışma zamanında sınırsız Python reflection/eval varsayma. `JsonValue` dinamik **veri ağacı** taşıyabilir; NOX tip sistemi dinamikleşmez.
- LLVM varsayılan, QBE alternatif backend; `noxc build`, `noxc check`, `noxc run`, `noxc test` mevcut. `noxc test` `*_test.nox` dosyalarını çalıştırır.
- `nox.template`: `render`, `render_unescaped`, `escape_html` ve `render_blocks`/`render_blocks_unescaped`; temel `{{ }}`, `{% for %}`, `{% if %}` destekler. **Glyph bundan ayrı, daha gelişmiş bir üründür; mevcut stdlib'i varmış gibi genişlettiğini iddia etme.**
- `nox.json`: `JsonValue`, `parse`, `dump`, tür testleri/okuyucular; sayısal hassasiyette `as_int` ve `number_text` ayrımını koru.
- `nox.regex`, `nox.unicode`, `nox.fs`, `nox.path.safe_join`, `nox.collections`, `nox.time`, `nox.http`, `nox.test` belgelenmiş; hepsinin hedef platformdaki capability durumunu kontrol et.
- `nox.reflect` sınırlı decorator metadata sunar; keyfi dinamik metot keşfi, import veya template'den fonksiyon çağırma izni değildir. Decorator'lar wrapper değildir.
- NOX `nox.json` manifesti ve SHA ile sabitlenen `nox.lock` üzerinden paket yönetir. Registry metadata yayını ve bağımlılık imzası araçları mevcuttur.
- `wasm32-wasi` / `wasm32-freestanding` hedefleri ve mobil hedefler mevcuttur; **platforma göre modül/capability sınırları değişir.** Freestanding/web/telefon için dosya sistemi ve thread varmış gibi kabul etme.
- `nyx` ayrı NOX web framework'üdür. Mevcut `nyx.view.render` döngü çalıştırmaz; `render_blocks`/`render_records` gibi yardımcılar bulunur. Glyph mevcut davranışı sessizce değiştirmeyecek; açık opt-in adapter sunacak.

**Doğrulama kaynakları:**
- https://github.com/mburakmmm/nox-lang/blob/main/docs/language/index.md
- https://github.com/mburakmmm/nox-lang/blob/main/docs/stdlib/index.md
- https://github.com/mburakmmm/nox-lang/blob/main/docs/stdlib/template.md
- https://github.com/mburakmmm/nox-lang/blob/main/docs/stdlib/json.md
- https://github.com/mburakmmm/nox-lang/blob/main/docs/stdlib/path.md
- https://github.com/mburakmmm/nox-lang/blob/main/docs/tools/packages.md
- https://github.com/mburakmmm/nox-lang/blob/main/docs/tools/testing.md
- https://github.com/mburakmmm/nyx/blob/main/README.md

**Sürüm politikası:** Core'un gerçek minimum NOX sürümü, Faz 0 denemeleriyle belirlenecek. Nyx entegrasyon testlerinin başlangıç referansı Nyx README'de belirtilen Nox `>= 2.1.186` ve Nyx `0.29.0` sürümleridir; geliştirirken güncel etiketleri yeniden doğrula. `>=` sözü compiler tarafından doğrulanmayan özellikler için verilmez.

---

## 1. Ürün vizyonu ve sınırlar

**Glyph**, NOX uygulamalarının HTML, metin, Markdown ve kontrollü yapısal çıktılar üretmesini sağlayan **gelişmiş, tipli, güvenlik öncelikli template engine** olacaktır. Jinja2 tasarımından esinlenir; Python çalışma zamanı, eval veya Jinja2 ile tam birebir uyumluluk hedeflemez.

### 1.1. Başlıca kullanım alanları

1. Nyx SSR sayfaları, e-posta şablonları, partial/component/layout sistemi.
2. Aether ile ilişkili HTTP yanıtları ve dokümantasyon/rapor çıktıları; API JSON'u için template yerine mümkün oldukça `nox.json` kullan.
3. CLI statik-site ve belge üretimi; kod üretimi ancak **güvenilir template kaynakları** ile.
4. i18n/locale-aware biçimlendirme; sistemin locale bilgisi açık parametreyle verilir.
5. WebAssembly/browser/serverless ortamlarında kısıtlı, saf bellekte render.
6. Aura'da **yalnızca uygun işlevsel alanlarda** (e-posta/html export, metin üretimi) kullanım; Aura'nın retained UI/widget ağacını Glyph ile ikame etmeye çalışma.
7. Bildirim, PDF için HTML hazırlığı, raporlama ve config scaffold; PDF motoru, DOM renderer veya CSS engine Glyph'e dahil değildir.

### 1.2. Kapsam dışı

- Template içinde Python/NOX kodu, shell komutu, `eval`, `exec`, `import` veya FFI çalıştırmak.
- Kullanıcı template'i aracılığıyla belirsiz nesne/metot/özellik erişimi ya da SQL/HTTP/file/system I/O yapmak.
- Tam HTML parser, JSX/VDOM, browser DOM, React/Vue uyumu veya frontend hydration runtime'ı olmak.
- Kullanıcı kimliği, RBAC/ABAC, authentication ve authorization politikası (Sentinel'in alanı); Glyph yalnızca içerik ve güvenlikli çıktı üretir.
- `nox.template` API'sini ya da Nyx'in public view davranışını sessizce değiştirmek.
- Jinja2'nin her edge case'inde veya Python truthiness'inde birebir uyum garantisi.
- Template kaynaklarına veritabanı erişimi açan implicit model binding; hazır typed view-model'ler kullanılmalı.

### 1.3. İlkeler

**NOX-first. Offline-first. Safe-by-default. Deterministic. Typed boundaries. Explicit authority. Composable. Observable. Minimal-dependency.**

---

## 2. Değişmez mimari ve güvenlik kuralları

1. Core kütüphane **NOX kaynak koduyla** yazılır. Güvenlik veya performans için C/Zig/native shim ancak ayrı ADR, ölçüm ve açık onay sonrası; Python veya Node runtime bağımlılığı yasaktır.
2. Template **veridir, program değildir**. Erişim yalnızca Glyph'in whitelist DSL'si, explicit value model'i ve kayıtlı saf fonksiyonlarıyla gerçekleşir.
3. Varsayılan HTML üretimi escape eder. Raw HTML **string** hiçbir koşulda kendiliğinden güvenilir olmaz.
4. `TrustedMarkup`, `SafeHtml`, `SafeAttr`, `SafeUrl`, `SafeJs` vb. güven türleri tasarlanabilir; güven, **hedef bağlama göre etiketlenir**. `SafeHtml` HTML attribute veya JS içinde otomatik olarak güvenli sayılmaz.
5. `|safe`, `|raw`, `autoescape false` gibi kaçış yolları varsayılan **untrusted** modda kapalıdır. Trusted-template modunda bile policy/bağlam doğrulaması gerekir ve kullanıcı verisini güvenli yapmaz.
6. Template **loader** path traversal, symlink escape, absolute-path/sibling-prefix ve uzaktan URL'ye dönüşme saldırılarını engeller. FS loader yalnızca izin verilen canonical root altından okur.
7. Eksik erişim, bilinmeyen helper, parse hatası, güvenli olmayan çıktı bağlamı ve resource limit aşımı **fail-closed** (güvenli hata) davranışı verir.
8. Render'ın dış dünya yan etkisi yoktur; loader I/O ayrı sınırdır. Registry'deki filtreler varsayılan **pure, deterministic, bounded** olarak sözleşmelidir.
9. Render'ın zaman, bellek, recursion, output byte, loop iteration ve include derinliği **bütçeyle** sınırlandırılır. Bütçe devreden alt render'larda paylaşılır; resetlenemez.
10. Cache key template adı tek başına olamaz; kaynak sürümü/fingerprint, mod/autoescape/policy, engine sürümü, extension registry kimliği ve locale etkileri dikkate alınır.
11. İki eşzamanlı render birbirinin scope'unu, context'ini, escape state'ini, budget'ını veya output'unu değiştiremez.
12. Template hataları **gizli veri ve mutlak dosya yolu** sızdırmaz. Hata konumu (file/line/column) ancak izin verilen mantıksal template adıyla döner.
13. Varsayılan çıktı deterministiktir; zaman, random, ağ, env ya da locale süreç globalinden okunmaz. Bunlar yalnızca açıkça verilen değer/policy ile kullanılabilir.
14. Template engine derleyiciyi değiştirmez; `noxc` kabiliyeti yetmezse özelliği belgelendirilmiş alternatifle uygula veya erteler.
15. Hiçbir public API `Any`'ye, Python nesne semantiğine, örtük reflection'a veya dinamik eval'a dayanamaz.
16. Safe HTML/XSS testleri geçmeden `v1.0.0` yayımlanmaz; security regression'ı performans için atlanamaz.
17. Bütün ifadelerde ve alt şablonlarda **capability'ler alt kapsama devredilmez**, policy gevşetilmez. Global uygulama güvenlik ayarı template içinden değiştirilemez.
18. Core hiçbir web framework'ünü import etmez. Adaptörler core'u import eder, tersi asla olmaz.

---

## 3. Sürüm kapsamı ve özellik haritası

Durum anahtarı: **MVP** = v0.1 hedefi, **STABLE** = v1.0 için zorunlu, **ADV** = v1.x genişletme, **RESEARCH** = uygunluk ispatı gerektirir. Hiçbiri yapılmış özellik anlamına gelmez.

| Alan | Özellik | Aşama | Not |
|---|---|---|---|
| Syntax | `{{ expr }}` / `{% ... %}` / `{# ... #}` | MVP | Lexer + span |
| Logic | `if/elif/else`, `for/else`, `set` | MVP | Lexical scope |
| Expr | Literal, lookup, index, boolean, compare, arithmetic | MVP | Sınırlı AST |
| Built-ins | `escape`, `default`, `length`, `join`, `upper`, `lower` | MVP | Type-checked |
| Safety | Default HTML escape ve limits | MVP | Fail-closed |
| Loader | Memory + locked FS root | MVP | Caching ayrı |
| Errors | Parse/runtime typed errors | MVP | File/line/column |
| Composition | `include`, `extends`, `block`, `super` | STABLE | Cyclic detect |
| Reuse | Macros, named args, imports, call/caller | STABLE | Kısıtlı, explicit |
| Filters | Registry, built-in filters/tests, namespacing | STABLE | Pure contracts |
| Whitespace | `{{-`, `-%}`, trim controls | STABLE | Golden tests |
| Safety | Contextual HTML escaping, TrustedMarkup policy | STABLE | XSS gate |
| Engine | AST/IR compile + render API + cache | STABLE | Portable |
| Performance | Writer/stream, bounded allocations | STABLE | Benchmarks |
| i18n | locale + catalogs + plural | STABLE | Deterministic |
| Tools | CLI lint/check/inspect | STABLE | Nox executable |
| Integrations | Nyx adapter, Aether opt-in | STABLE | Contract tests |
| Dev tools | Diagnostics, source-map, editor grammar | ADV | LSP optional |
| Composition | Component/slot and scoped style helpers | ADV | Not DOM |
| Reuse | `with`, filter blocks, namespace modules | ADV | Spec first |
| Formats | Markdown/text/XML/email-specific policies | ADV | Context aware |
| Optimizations | Constant folding, cache sharing, streaming | ADV | Proof-based |
| Ecosystem | Aura export, Obsidian/Pulse hooks | ADV | Optional |
| Streaming | Async writer/cancellation where feasible | RESEARCH | Platform tests |
| Compilation | Ahead-of-time template → typed Nox source | RESEARCH | No compiler patches |
| Sandboxing | User-authored templates in hostile multi-tenant mode | RESEARCH | High risk, explicit scope |

`v1.0` için geniş ama kontrol edilebilir özellik seti hedeflenir. ADV/RESEARCH maddeleri `v1.0` önkoşulu değildir; kalite kapısını ertelemek için bunların eksikliği gerekçe olamaz.

---

## 4. Katmanlı mimari ve bağımlılık yönü

```text
                Application / Nyx / Aether / CLI / WASM host
                                  |
                           optional adapters
                                  |
       +------------------- glyph.api -------------------+
       |            Environment / Template              |
       |  Loader + Registry + Policy + Cache + Locale    |
       +------------------------+-----------------------+
                                |
                +---------------+------------------+
                |                                  |
         compile pipeline                     render pipeline
  lexer -> parser -> AST -> validator       VM/AST walker -> Writer
                |                                  |
                +-------- Expression IR -----------+
                                |
           Value + Scope + Escaping + Limits + Errors
                                |
              verified Nox stdlib capabilities
```

### 4.1. Repo önerisi

```text
glyph/
  AGENTS.md
  README.md
  LICENSE
  CHANGELOG.md
  SECURITY.md
  CONTRIBUTING.md
  nox.json
  nox.lock
  glyph/
    api.nox
    environment.nox
    options.nox
    value.nox
    scope.nox
    lexer.nox
    token.nox
    parser.nox
    ast.nox
    expressions.nox
    validate.nox
    runtime.nox
    writer.nox
    errors.nox
    limits.nox
    safety.nox
    filters.nox
    tests_registry.nox
    functions.nox
    loader.nox
    loader_memory.nox
    loader_fs.nox
    cache.nox
    inheritance.nox
    macros.nox
    locale.nox
    catalog.nox
    diagnostics.nox
    version.nox
  integrations/
    nyx/            # bağımsız paket ya da örnek adapter
    aether/
    aura_export/
  cli/
    main.nox
  tests/
    lexer/
    parser/
    expression/
    rendering/
    security/
    composition/
    loaders/
    cache/
    locale/
    integration/
    regression/
    fuzz/
    fixtures/
      valid/
      invalid/
      jinja_subset/
  examples/
    hello/
    blog_layout/
    email/
    static_site/
    nyx/
    aether/
    wasm_memory/
  benchmarks/
  tools/
  docs/
    ARCHITECTURE.md
    compatibility.md
    syntax.md
    expressions.md
    security.md
    api.md
    filters.md
    loaders.md
    integration-nyx.md
    integration-aether.md
    performance.md
    testing.md
    roadmap.md
    adr/
  .github/workflows/
```

**Kural:** Dizinin gerçek NOX paket/import düzenine ve örnek consumer build'ine uyumu Faz 0'da doğrulanacak; doğrulanmadan bu ağaç üzerinde dogmatik davranılmayacak. `glyph/` altından `integrations/nyx` import etmek yasaktır. Kullanıcı `import glyph.api` gibi sabit, belgelenmiş bir giriş kullanmalıdır.

### 4.2. Modül sorumlulukları

- `lexer`: delimiter tanıma, Unicode/byte offset, whitespace tokenları; semantik değerlendirme yapmaz.
- `parser`: grammar doğrulama, recovery stratejisi, source span; güvenlik izinleri kararı vermez.
- `ast`: statik immutable node modelleri; kullanıcı veri referansı taşımaz.
- `validate`: hata/unknown symbol analizi, constant folding için güvenli bilgi, izin verilen bağlam kontrolü.
- `runtime`: scope/loop/macro/include/variable semantics; dosya okuma yapmaz.
- `value`: sınırlandırılmış dinamik template veri modeli; keyfi host nesnelerini çalıştırmaz.
- `safety`: çıktı bağlamı tahmini, escape stratejileri, trusted-label kontrolü.
- `writer`: çıktı sınırı, backpressure ve iptal kontrolü; encoder seçimi.
- `loader`: template adından izinli kaynak çözümü; cache değil.
- `cache`: yetkili source id + fingerprint ile derlenmiş template saklama; kapsam karıştırmaz.
- `locale`: mesaj katalogları ve locale policy; `nox.time` gibi global duruma dayanmaz.
- `integrations`: framework adapter'ı; core policy'yi zayıflatmaz.

---

## 5. Tipli Value sistemi ve context sözleşmesi

### 5.1. İfade edilecek veri türleri

Açık tagged union / enum + payload ya da mevcut NOX tiplerinin derlenebilen karşılığı kullanılır:

- Null
- Boolean
- Integer (NOX `int`, taşma kontrolü)
- Float (NaN/Infinity politikası açık)
- Decimal/BigInt **yalnızca doğrulanmış destek veya canonical string** ile
- String (UTF-8, kontrol karakterleri)
- List[Value]
- Map[str, Value] (sıralama politikası belirli)
- TrustedMarkup (çıktı-bağlamı etiketli)
- Callable **yalnızca registry'den kayıtlı, tipli, capability kısıtlı helper**
- Date/time/URL gibi zengin türler **registry adapter** üzerinden ve kanıtlanmış.

`Value` NOX `Any` değildir. Host nesnesinin arbitrary method/attribute erişimi tasarımdan dışlanır.

### 5.2. Dönüştürme kuralları

- `JsonValue` → `Value`: köken JSON; `JsonValue`'un null/bool/string/array/object türleri korunur. Integer yüksek hassasiyeti `as_int` veya `number_text` üzerinden ele alınır, float'a zorla indirilmez.
- `Value` → string yalnızca açık `stringify` kurallarıyla. List/map'in varsayılan çıktısı DSL'ye uygun bir hata veya belgelenmiş gösterimdir; Python `repr` taklidi değil.
- `undefined` null değildir. Undefined politikası `StrictUndefined` (varsayılan) veya açık `LenientUndefined` (yalnızca legacy) olur; güvenlik kararında `undefined = false` gibi sessiz davranışa güvenilmez.
- Key lookup yalnızca map alanı; `user.__class__`, `__dict__`, reflection/meta özellikleri hiçbir zaman çözülmez.
- Dizilerde index negatif/pozitif semantiği belgelenir. Hata/undefined, out-of-range üzerinden deterministik.
- `int` / `float` işlemlerinde overflow, division-by-zero, negatif shift gibi tüm durumlar açık hata politikası taşır.
- String equality Unicode normalization yapmaz; isteğe bağlı normalize filtresi açık adla.
- `null`, `false`, `0`, `""`, `[]`, `{}` truthiness tablosu DSL dokümanında ayrı ayrı belirtilir ve test edilir.
- Sıralama heterojen türlerde gizli dönüşümle yapılmaz; explicit comparator/field gerektirir.
- `SafeHtml` işaretleri JSON dönüşümlerinde kaybolur; JSON'dan yüklenen input hiçbir zaman otomatik trusted olmaz.

### 5.3. Scope modeli

- Global environment ayarı (immutable), render context (request-local), block scope, loop scope, macro scope, include scope ayrılır.
- Child scope shadow yapabilir; parent scope'a yazamaz. `set` sadece izinli mevcut/yerel lexical scope'a yazar; global registry'yi değiştiremez.
- `include ... with context` seçeneği explicit; default en az ayrıcalık (v1 için karar ADR ile). `without context` mutlaka desteklenecek.
- Macro closure yalnızca tanımlandığı scope'un immutably captured izinli değerlerine erişebilir; runtime leakage yoktur.
- Her render kendi `RenderContext`, `Budget`, `Writer`, `Diagnostics` nesnesini taşır; module globals altında mutable request state yasak.

---

## 6. Template dili: lexical grammar

### 6.1. Delimiter ve bloklar

| Form | Anlam | Hata koşulu |
|---|---|---|
| `{{ expression }}` | ifade çıktısı | kapanmayan veya geçersiz expr |
| `{% statement %}` | kontrol/deklarasyon | unknown tag veya yanlış nesting |
| `{# comment #}` | yorum | kapanmayan comment |
| `{% raw %}...{% endraw %}` | literal delimiter içeriği | kapanmayan raw |
| `{{- ... -}}`, `{%- ... -%}` | komşu whitespace trim | deterministik whitespace |
| `{% if x %}...{% elif y %}...{% else %}...{% endif %}` | koşul | hatalı elif/else sayısı |
| `{% for x in seq %}...{% else %}...{% endfor %}` | iterasyon | yanlış binding / unpack |
| `{% set name = expression %}` | yerel değişken | illegal target |
| `{% include "x.html" %}` | dahil et | invalid path/cycle |
| `{% extends "base.html" %}` | kalıtım | top-level sıra ihlali |
| `{% block name %}...{% endblock %}` | değiştirilebilir alan | duplicate block |
| `{{ super() }}` | parent block | parent yok |
| `{% macro name(a, b=...) %}...{% endmacro %}` | saf macro | duplicate arg |
| `{% import "helpers.html" as h %}` | macro namespace | circular import |
| `{% from "helpers.html" import x %}` | sembol import | private/unknown |
| `{% call x(...) %}...{% endcall %}` | caller body | çağrılmaz macro |
| `{% with x = expr %}...{% endwith %}` | scoped value | ADV |
| `{% filter name %}...{% endfilter %}` | block filter | ADV |

`{% break %}`, `{% continue %}`, `{% do %}`, `{% debug %}` ve dinamik import gibi Jinja2 ekleri varsayılan kapsam dışıdır; kabul edilecekse ayrı ADR, semantics, budget ve test gerekir.

### 6.2. Lexer zorunlulukları

- Karakter ve byte offset farkını koru; `SourceSpan` UTF-8 byte start/end + line/column içersin.
- UTF-8 kötü biçimli input reddedilir ya da açık normalize/replace policy ile ele alınır; sessiz bozulma yok.
- String literal, escape, comment ve raw içinde delimiter yanlış tanınmaz.
- `{%`/`{{` kapanmadığında deterministik parse hatası; line/col raporla.
- Maksimum token sayısı, token uzunluğu, template byte sayısı için limit vardır.
- Whitespace trimming `\r\n`, `\n`, `\t`, Unicode whitespace (desteklenen altküme) için golden-fixture ile belirlenir.
- Nested raw engelli ya da açık spec'li; JSON/HMTL literal parse edilmez.
- Scanner O(n) hedefler; her karakterde tekrar tekrar substring birleştirerek O(n²) yapma.

### 6.3. Parser ve AST

AST düğümleri: `Text`, `OutputExpr`, `If`, `For`, `Assign`, `Include`, `Extends`, `Block`, `MacroDef`, `MacroCall`, `Import`, `FromImport`, `CallBlock`, `Raw`, `FilterBlock`, `With`, `Comment` (yorum gerekirse AST'den çıkar). Her düğüm `SourceSpan`, açık children ve validasyon durumuna sahip.

İki aşamalı parser: statement nesting parser + Pratt/precedence-climbing expression parser. Derlenebilirlik anlaşılmadan reflection tabanlı visitor veya hesaplanmış generic tip hileleri tasarlama. AST node karşılığı NOX'un `enum/match` ya da tagged-class yaklaşımıyla proof-of-concept üzerinden seçilir.

### 6.4. Hata toparlama

- Render için parse hatasında template **yürütülmez**.
- Lint/editor için recoverable parse diagnostics biriktirilebilir; düzeltilmiş sahte AST production'a gönderilmez.
- Hata önceliği: invalid token → nesting → expression type/arity → policy violation → evaluation limits.

---

## 7. Güvenli expression dili

### 7.1. İzin verilen ifade grameri

```text
expr          := conditional
conditional   := or_expr ("if" or_expr "else" conditional)?
or_expr       := and_expr ("or" and_expr)*
and_expr      := not_expr ("and" not_expr)*
not_expr      := "not" not_expr | compare
compare       := sum (("=="|"!="|"<"|"<="|">"|">="|"in"|"not in"|"is") sum)*
sum           := product (("+"|"-") product)*
product       := unary (("*"|"/"|"//"|"%") unary)*
unary         := ("+"|"-") unary | filter_expr
filter_expr   := primary ("|" identifier ("(" args ")")?)*
primary       := literal | identifier | "(" expr ")" | list | map
                 | primary "." field | primary "[" expr "]"
                 | registry_call | primary "is" ["not"] test_name
args          := [expr ("," expr)*]  # named arguments restricted by spec
```

Bu gramer **taslak sözleşmedir**. Pratt precedence, `is` binding ve conditional/pipe ayrıntıları `docs/expressions.md` içinde ilk implementasyondan önce kesinleştirilir; Jinja2'nin tüm Python operatorlerini taşımak zorunda değiliz.

### 7.2. İfade sınırları

- Literaller: null/none, true/false, int/float, string, list, map. Düz string interp sonucu güvenli değildir.
- Dot notation **yalnızca map field lookup**; objenin metodunu çağırmaz.
- Fonksiyon çağrıları yalnızca **registry whitelist** üzerinden; `foo.bar()` ile reflection yasak. İstisna `super()` ve loop metadata gibi özel, compiler-known safe intrinsics.
- `range(n)` yalnızca bounded helper olarak; kontrolsüz çok büyük dizi oluşturmaz.
- `in`, `not in` list/map/string için açık semantiğe sahip; `is` yalnızca registry tests üzerinde.
- Regex helper varsa `nox.regex` backtracking limitleri ve ek input limitleri ile; public regex patterne izin security policy'ye bağlı.
- Döngü içinde helper çağrıları bütçeden düşülür; recursive macro default limitli.
- Template'te atama ile map/list içeriği mutate edilemez; değerler logical immutable varsayılır.
- `await`, `spawn`, lambda, comprehension, generator, class constructor, `open`, `request`, `os`, native/FFI vs DSL'de yoktur.

### 7.3. Sabit katlama (constant folding)

Sadece yan etkisiz ve locale/policy bağımsız operatörlerde yapılır. `urlencode`, `date`, i18n, locale-sensitive helper'lar yanlış zamanda compile edilmez. Uygulanan her optimizasyon için optimize edilmiş/edilmemiş render diferansiyel testi gerekir.

---

## 8. Render motoru ve execution model

### 8.1. İlk karar

**İlk üretim mimarisi: Source → Tokens → AST → Validated IR → AST interpreter → Writer.** Template kaynağını NOX/FFI koduna çevirmek, compiler çağırmak veya doğrudan native kod yürütmek v1 için zorunlu değil; template içerik saldırıları nedeniyle kaynak kod çalıştırma yoktur.

### 8.2. Derleme

- `compile_string(source, name, options)` bellekte üretir.
- `get_template(name)` loader ile getirir; validasyon ve cache policy'yi uygular.
- Compilation render context'e erişmez, parametreleri değerlendirip side effect oluşturmaz.
- Extends/import dependency graph kaynak identity ile saklanır, cycle tespit edilir.
- `Template` nesnesi immutable, reentrant ve ömür yönetimi güvenlidir.
- Runtime IR formatı public serialization olarak garanti edilmez; disk-cache biçimi eklenecekse versiyon, checksum ve güvenilir kaynak sözleşmesi gerekir.

### 8.3. Evaluation

- Her evaluation `RenderContext` ve budget parametreleri alır.
- Short-circuit `and/or`, conditional expression ve optional helpers'ın semantiği testlidir.
- Map/list erişimi constant-time varsayımı yerine ölçülür; değer türlerine göre gelişmiş cache ayrı optimizasyon.
- Child render ve macro aynı writer, budget, cancellation state'i devralır.
- `for` varsayılan iteration order: list için giriş sırası, map için açık ordered map politikası. Deterministik değilse map iteration yasaklanır/sorted filter beklenir.
- `loop.index`, `index0`, `first`, `last`, `length`, `revindex` ancak veri kaynağı boyutu biliniyorsa; streaming iterator'da boyut gerekirse uyumlu fallback/unsupported.
- `include` hata davranışı: default fail; `ignore missing` yalnızca literal sintaks ve policy'nin izin verdiği dosyada.
- Tüm recursive çağrılar depth budget'a dahildir.

### 8.4. Writer ve streaming

- `render_to_string` sınırlı string writer kullanır.
- `render_to_writer` her yazmada output byte budget uygular; hata olduğunda partial output bilgisi açık döner.
- Streaming SSR'de başlamış HTTP yanıtının status/header'ı geriye alınamaz; adapter karar vermeden önce preflight/başlık hazırlığı, sonra controlled streaming yapar.
- Çok küçük parça başına flush veya her iterasyonda string concatenation yasak. Chunk buffer ve batch flush hedef.
- Backpressure, cancel ve timeout IO adapter'a aittir; core writer protokolü bunları failure sonucu şeklinde taşımalıdır.
- Sıralı template output garanti; worker paralelliği render sırasını bozmamalı.

### 8.5. ResourceBudget

Başlangıç **konfigürasyon örneği** (release öncesi ölçülüp gerekçeli default seçilir):

| Alan | Örnek başlangıç sınırı | Davranış |
|---|---:|---|
| source bytes | 1 MiB | compile-time reject |
| max tokens | 100.000 | compile-time reject |
| max AST nodes | 100.000 | compile-time reject |
| include depth | 32 | runtime reject |
| macro recursion depth | 32 | runtime reject |
| expression depth | 64 | parser/runtime reject |
| loop steps | 1.000.000 | runtime reject |
| output bytes | 16 MiB | writer reject |
| total operations | 5.000.000 | runtime reject |
| wall-clock budget | optional, explicit | platform clock yoksa operasyon bütçesi |

Bu sayılar **taslak ürün tercihidir**, NOX runtime limitleri değildir; policy ile aşağı çekilebilir, user-template modda daha sıkı olmalıdır. Limit aşılması `GlyphLimitError` ve ilgili kod ile raporlanır. Shared budget alt çağrıda yeniden başlatılmaz.

---

## 9. Composition: inheritance, blocks, includes, macros, components

### 9.1. Inheritance

- Parent-child zinciri lexical/compile aşamasında tanımlanır; `extends` yalnızca top-level ve izinli konumda.
- Block override deterministiktir; `super()` bir seviye parent'ı render eder, cross-template güvenlik policy'sini devralır.
- Duplicate block, ambiguous override, missing block ve inheritance cycle açık hata.
- Parent template'i ayrı root'tan getirmeye veya loader değiştirmeye çalışmak yasak.
- Block cache render context/policy'den bağımsız AST tutar; **render edilen HTML caching** ayrı, daha riskli, opsiyonel bir ürün özelliğidir.

### 9.2. Include ve import

- Template adı literal string varsayılan. Dinamik template adı yalnızca trusted-template policy'de ve **aynı kök/allowlist** içinde ayrı özellik olarak.
- Include varsayılan `with context` mi `without` mı olacağı ADR ile kesin; her iki tür açık operator olarak test edilir.
- İçe aktarılan macro namespace immutable; export edilen isimler explicit whitelist; `_private` convention güvenlik sınırı değil, registry policy asıl sınırdır.
- Directory traversal, SSRF, path escape ve cycle testleri zorunlu.

### 9.3. Macro sistemi

- Değer parametreleri (positional/keyword/default) tipli Value'lar; arity/duplicate/unknown keyword error.
- Macro return: HTML/text fragment sonucu ayrıca safe context etiketine sahip. İçerikte güvenilmeyen veriler default escape edilir; macro sonucu otomatik `TrustedMarkup` olmaz.
- Recursive macro execution ortak budget kullanır.
- `caller` (block callback) ancak explicit, sınırlı ve reentrant invocation modeliyle.
- Her macro'nun kaynak span'i tanılama zincirinde tutulur.

### 9.4. Component / slot genişletmesi (ADV)

`{% component "card" title=x %}...{% slot "footer" %}...{% endslot %}{% endcomponent %}` gibi özel syntax kararı ayrı ADR ile; önce macro+block ile aynı işin yapılıp yapılmadığını göster. Component API SSR HTML parçalarını temsil eder, Aura widget'ına veya browser DOM'una dönüşmez. Slot içerik bağlamı, ownership ve escape güvenliği bağımsız test edilir.

---

## 10. Güvenlik: escape, trust ve output context

### 10.1. Güvenlik hedefi

HTML escape, HTML text düğümünde ve uygun biçimde quote edilmiş attribute value'da temel korumadır; JS, CSS, URL, event handler veya `<script>` içine güvenli biçimde değer gömmek **otomatik olarak HTML escaping'le çözülmez.** Bu ayrım birincil ürün invariant'ıdır.

### 10.2. OutputContext model

- `HtmlText`
- `HtmlAttributeQuoted`
- `HtmlAttributeUnquoted` (**varsayılan yasak**, explicit strict serializer)
- `HtmlUrlAttribute` (scheme allowlist + uygun encoding + attribute escaping)
- `HtmlJs` / `HtmlEventHandler` (**untrusted interpolation yasak**)
- `HtmlCss` / `StyleAttribute` (**untrusted interpolation yasak**, sınırlı CSS serializer ayrı)
- `HtmlTagOrAttrName` (**untrusted interpolation yasak**)
- `XmlText` / `XmlAttribute`
- `PlainText`
- `MarkdownText` (tam Markdown güvenliği diye sunma)
- `JsonString` / `JsonValue` (JSON writer üzerinden; HTML/script embedding ayrıca korunur)
- `Unknown` (**fail-closed**)

Parser'daki HTML context tracker minimal ve temkinli olabilir. Bilinmeyen malformed HTML, raw/script/style yorumlaması veya dinamik tag/attribute adında **unsafe context** hatası verilir; Jinja-benzeri esneklik uğruna false-safe davranma.

### 10.3. Autoescape ve trust API

- HTML output üretiminde `autoescape=ON` varsayılan.
- Filter `escape_html()` belirli context'e escaping uygular; girdi `TrustedMarkup` değilse de her defa doğru katmanda encode edilir.
- `mark_safe`/`safe` filtreleri **normal uygulama bağlamında sunulmaz**. Yalnızca host kodunun explicit `trust_html_fragment` gibi kontrollü işaretleyicisi ve source provenance kontrolüyle güven yükseltilebilir.
- `SafeHtml` başka bağlamda otomatik SafeUrl/JS olmamalı.
- `escape(escape(s))` double-escape semantiği açık; safe marker kaydı testlidir.
- Escape edilmiş literal, user string ile birleştirilince güven etiketi kirlenir; güvenli concatenation algoritması, provenance ve context koşullarına tabi.
- `|tojson` JSON serializer kullanır; `<`, `>`, `&`, U+2028/U+2029 ve `</script` benzeri HTML embedding risklerine karşı **ayrı JS-in-HTML escape sözleşmesi** gerekir. Default olarak template içindeki `<script>` interpolation kapalı kalabilir.
- HTML sanitizer ürüne alınırsa standartlaştırılmış, güvenilir ve test edilmiş bir sağlayıcı seçilir; basit regex HTML sanitizer değildir. Sanitizer olana kadar raw user HTML kabul edilmez.

### 10.4. URL ve HTML attribute

- `href`, `src`, `action`, `formaction`, `srcset` vb. adres alanları ayrı güvenlik kontrolü gerektirir.
- `javascript:`, `data:` (policy izin vermezse), `vbscript:`, kontrol karakteri/space ile gizlenen scheme varyantları reddedilir.
- HTTP/HTTPS/mailto/tel ve relative URL allowlist'i uygulama tarafından belirlenir; bilinmeyen scheme fail.
- URL encode tek başına scheme validation değildir. Query parametrelerini string concat yerine URL bileşeni serializer'ıyla üretmek hedeflenir.
- Dinamik `on*` event handler attributeları, `<script>` veya `<style>` içinde serbest değer interpolasyonu yasak.
- `srcdoc`, `style`, `nonce`, CSP-sensitive alanlar özel policy gerektirir.

### 10.5. Kullanıcı kaynaklı template'ler

**Threat model:** Bir saldırganın template kaynak metni değiştirebildiği durum, yalnızca context değerini değiştirebildiği durumdan çok farklıdır.

1. **Trusted templates**: uygulama koduyla dağıtılan, kod incelemesinden geçen; yine de I/O ve arbitrary helper yok.
2. **Restricted templates**: yönetici/tenant kullanıcının düzenleyebildiği; raw/safe, dynamic include, custom side-effect helper, time/random/network, sensitive variables yok; sıkı limits.
3. **Untrusted template source**: saldırgan tarafından kontrol edilen; default v1.0 üretim desteği yok. Gerçek isolation istenirse WASM/ayrı process gibi host isolation + proof gerekir; sadece whitelist DSL **işlem/sistem izolasyonu** garantisi değildir.

Template ve context güven düzeylerinin birleştirilmesinde **en kısıtlayıcı policy kazanır**. Trusted parent, untrusted child'i sınırsız hale getirmez.

### 10.6. Güvenlik testleri zorunlu

- HTML text/attr, quote bypass, malformed delimiter, Unicode normalization, NUL, entity/double encoding.
- `<script>`, `</script>`, JS string/bare expression, `onerror`, `style`, `srcdoc`, SVG/MathML ve dinamik tag/attr.
- `javascript:` / farklı case / whitespace / percent encoded / HTML entity encoded URL payload'ları.
- `SafeHtml`'in URL/JS/attr'e taşınması, split/concat ve macro/include sırasında trust düşüşü.
- `../`, `%2e%2e`, absolute path, symlink, sibling-prefix, TOCTOU FS loader.
- Template expression üzerinden `__class__`, `__dict__`, `constructor`, `prototype`, host method, reflection, builtin/global erişimi.
- Recursive macro/include, büyük range, çok büyük output, regex pathological input.
- Cache policy mixing, locale mixing, concurrent render bleed, error message sensitive data.
- Template hash/escape mode değişiminde cache invalidation.

**Release gate:** Bu güvenlik regresyonlarının tamamı beklenen sonucu vermelidir; 'false positive olabilir' denilerek bypass açılmaz.

---

## 11. Loader sistemi ve path izolasyonu

### 11.1. Loader protokolü

Önerilen sözleşme: `load(name, request_context) -> SourceRecord | LoadError`.

`SourceRecord`: logical_name, immutable content, origin_id, fingerprint/version, optional encoding, last_modified (güvenilir değilse null), trust policy. Source record'da gizli fiziksel path'in public error'a çıkmaması sağlanır.

### 11.2. Desteklenen loader'lar

1. `MemoryLoader`: `dict[str,str]` veya typed map; test, WASM, browser, serverless, e-posta.
2. `FilesystemLoader`: sabit canonical root; `nox.path.safe_join` + açma sonrası yeniden doğrulama/ayrı güvenlik politikası; root dışına symlink traversal yok.
3. `ChoiceLoader` / `PrefixLoader`: explicit ordered resolution ve collision behavior; farklı trust zoneları karıştırılmaz.
4. `PackageLoader`: registry ile gelen güvenilir paket içi templates (ADV, explicit path/manifest).
5. `DatabaseLoader`: host tarafından sağlanan read-only loader adapter (ADV, core DB/network bağımlılığı yok).
6. Remote HTTP loader **default kapsam dışı**; ancak imzalı/pinli içerik, SSRF politikası, cache ve izinli domain ile ayrı ADR sonrası.

### 11.3. Dosya güvenliği

- Sadece `${root}/...` gibi uygulama tarafından önceden tanımlanmış directory roots; template adı kullanıcı tarafından mutlak dosya path'i yapılamaz.
- Canonical root yoksa açık hata; `safe_join` result + open işlemi arasında symlink race olası ise atomik `openat` tarzı primitive yokluğunu güvenlik dökümünde belirt ve write-capable hostile FS senaryosunda destek verme.
- `.`, `..`, NUL, drive-letter, Windows UNC, `/`, `\`, mixed separators ve UTF-8 normalizasyon edge case'leri normalize/reject edilir.
- Disk loader yalnızca filesystem capability ile. WASM/browser modda MemoryLoader temel destek; FS varmış gibi davranma.
- Sıralı loader fallback'ı başarısız yetkilendirme durumunda başka güvenlik root'una düşmez.

---

## 12. Cache ve dependency graph

### 12.1. Cache türleri

- **ParseCache:** source hash + parser/engine sürümü + syntax flags.
- **CompileCache:** AST/IR + normalized policy + extension registry generation + dependency fingerprints.
- **RenderCache (ADV):** default off; yalnızca uygulamanın explicit cache key, varyant ve sensitive-data sınıflandırmasıyla; kullanıcı/private HTML global cache'e koyulamaz.
- **Filesystem watcher/invalidation (ADV):** yalnızca hosted development; üretimde explicit version/fingerprint.

### 12.2. Tutarlılık

- Cache identity tenant/trust/policy/locale farkıyla paylaşılmaz. Loader `name` değil `origin_id+fingerprint` canonical identity sağlar.
- Atomic replace; partial derleme veya invalid IR publish edilmez.
- Stampede control varsa lock rekürsiyonu ve deadlock testleri.
- TTL kaynak bütünlüğünün yerine geçmez. Template bağımlılığı değişince parent dependency graph invalidation gerekir.
- LRU / max entries / max bytes belirlenir. Memory pressure altında deterministik eviction ve render'a devam veya kontrollü hata.
- Shared cache immutable compile artifact içerir; render state ve output asla aynı nesnede tutulmaz.
- Thread safety varsayılmaz: NOX concurrent/threads proof ve TSAN benzeri dış araçlarla doğrulanır.

---

## 13. Filters, tests ve helper registry

### 13.1. Registry API sözleşmesi

`FilterSpec`: namespace/name, arity/range, expected Value types, result type, pure/deterministic, allowed output contexts, needs_locale, cost_class, maximum_expansion, policy_requirement. Aynı model `TestSpec`, `FunctionSpec` için.

- Registry yüklenirken isim çakışması/override açık politika; core güvenlik helper'ları override edilemez.
- Filter callback, NOX tarafında doğrulanmış first-class function/typed closure modeli üzerinden; imza derlenmiyorsa enum-based dispatch ile başla. Keyfi reflection/动态 function lookup yok.
- Helper'a `RenderContext`'in tamamını vermek yerine `HelperContext` (locale, immutable config, shared budget, diagnostics) verilir.
- Helper kayıtları render başladıktan sonra değişmez. Registry generation cache key'e eklenir.
- Üçüncü parti helper'lar güven sınırıdır; saf sözleşmenin otomatik sandbox anlamına gelmediğini dokümante et.

### 13.2. Built-in filter seti: hedef

**Strings:** `upper`, `lower`, `capitalize`, `title`, `trim`, `replace`, `truncate`, `wordcount`, `indent`, `center`, `pad`, `striptags` (basit metin dönüşümü; sanitizer değil), `normalize_unicode` (NFC vs explicit), `urlencode`, `slugify` (locale-aware kuralları açık).

**Escaping:** `escape`, `forceescape` (ayrı semantik), `tojson`, `urlencode`; `safe` varsayılan kapalı. `xml_escape` XML target için.

**Collections:** `length`, `first`, `last`, `reverse`, `sort`, `unique`, `join`, `map(attribute=...)`, `select`, `reject`, `batch`, `slice`, `sum`, `min`, `max`, `groupby`, `dictsort` (yalnızca bounded ve açık typelarla). `map` dynamic method çalıştırmaz.

**Numbers/formatting:** `abs`, `round`, `int`, `float`, `number`, `currency`, `percent`, `filesize`, `default`, `string`; locale-sensitive biçimler explicit locale ile.

**Dates/times:** `date`, `datetime`, `relative_time` (yalnızca explicit reference time), timezone format (sadece doğrulanmış nox.timezone/host capability).

**Markdown:** `md_escape` yalnızca hedeflenen bir bağlam için. Markdown → HTML parser/sanitizer içermeyen sürümde `markdown` filtresi raw HTML güvenliği iddia edemez; ayrı trusted plugin.

**Opt-in advanced:** localization `trans`, `plural`, `humanize`, `json_pretty`, `uuid` formatting (random üretimi değil), `hash` (crypto API'ye uygun olsa bile security kararları için değil).

### 13.3. Built-in tests

`defined`, `undefined`, `none/null`, `boolean`, `number`, `integer`, `float`, `string`, `sequence`, `mapping`, `iterable`, `empty`, `equalto`, `odd`, `even`, `divisibleby`, `in`, `escaped` (context typed), `safe_for` (context exact).

### 13.4. Helper sınırları

- Side-effect helper (e-posta göndermek, DB sorgulamak, ağ isteği, dosya yazma) core'da **yasak**.
- SQL/HTTP sorgusu gerekiyorsa uygulama önceden sonucu getirip view-model'e koyar.
- `include` path/loop dışarıdan gelen isimden kontrolsüz yapılmaz.
- Filter'ların yığılarak limits bypass etmesi yasak; her output byte ve operation shared budget'a sayılır.

---

## 14. Internationalization (i18n) ve locale

- `RenderOptions.locale` açık verilir; process-global locale veya timezone'dan sessiz okunmaz.
- Translation catalog adapters saf read-only map/callback şeklinde; compile edilmiş katalog version/key identity cache'e dahil.
- `trans`/`plural` tasarımı tekil-çoğul kurallarını destekler; CLDR/ICU kapsaması **veriye bağlıdır**. Yanlış 'tam Unicode/CLDR desteği' beyanı yok.
- Locale fallback zinciri explicit: örn. `tr-TR -> tr -> default`; missing translation `strict` veya açık fallback policy.
- Interpolated parametreler çevrilmiş text içinde bile output context escape edilir. Çeviri stringlerinin raw HTML olduğu varsayılmaz.
- Date/number/currency formatı resmi locale data yoksa küçük belgeli altkümeye düşer; format sözleşmesi fixture'larla dondurulur.
- Turkish casing için `nox.unicode.upper_tr/lower_tr` doğrulanmıştır; diğer locale casing ayrı kural/katman.
- Locale kaynaklarını host app kontrol eder; network catalog auto-fetch yoktur.
- RTL/BiDi ve font shaping Glyph'in UI rendering sorumluluğu değildir. Unicode injection/bi-di spoofing için diagnostic opsiyon olabilir.

---

## 15. Çıktı profilleri ve format sözleşmeleri

### HTML

Default. Contextual escape, trusted markup policy, `content-type: text/html; charset=utf-8` önerisi adapter üzerinden. HTML sanitizer/DOM parser değildir.

### PlainText

Özel `OutputMode.Text`: HTML escape etmez; ancak resource, helper ve policy kuralları geçerli. HTML template'i yanlışlıkla text modda çalıştırmanın güvenlik etkisi application config'te açık.

### XML

Text/attribute escaping + illegal XML karakter kontrolü. XML injection için dynamic tag/attribute-name yasak. DTD/XXE parse işine girmez.

### Markdown

Literal Markdown üretebilir, fakat Markdown'dan HTML'e sonraki dönüştürme ayrı güvenlik sınırıdır. Kullanıcı girdisi Markdown/HTML olarak işlem görecekse ayrı escaping/sanitization kararına bağlanır. `md_escape` evrensel XSS çözümü değildir.

### JSON / JavaScript embedding

JSON için tercihen `nox.json.JsonWriter`/`dump_string`, template string interpolation değil. `application/json` gövdesi ile HTML içine JSON gömme farklı risk; inline script JSON için özel ayrı serializer ve güvenlik testleri gerekir.

### Email

HTML + plain-text multipart şablon çifti, subject/header newline injection önlemleri application mailer'da; Glyph subject string döndürürken CR/LF policy'yi uygulayabilir. Gönderim/SMTP Ember/Nyx/mail adapter'a ait.

---

## 16. Önerilen public API sözleşmeleri

**Bu bölüm tasarım pseudocode'udur; derlendiği ispat edilene kadar gerçek NOX kodu sanılmayacak.** Gerçek imzalar `docs/api.md` ve `tests/contracts/` ile dondurulur.

### 16.1. Core yüzeyi

```text
Environment(loader: Loader, options: EnvironmentOptions,
            filters: FilterRegistry, tests: TestRegistry,
            cache: CompileCache | None) -> Environment

compile_string(source: str, logical_name: str, env: Environment) -> Template
get_template(name: str, env: Environment) -> Template
render(template: Template, context: Context, options: RenderOptions) -> str
render_to_writer(template: Template, context: Context,
                 writer: GlyphWriter, options: RenderOptions) -> RenderResult
lint(source: str, name: str, env: Environment) -> list[Diagnostic]
inspect(template: Template) -> TemplateInfo
escape_html(text: str) -> str
```

Typed errors: `GlyphSyntaxError`, `GlyphUndefinedError`, `GlyphTypeError`, `GlyphSecurityError`, `GlyphLoadError`, `GlyphLimitError`, `GlyphRenderError`, `GlyphExtensionError`, `GlyphCancelledError`. Hepsi stable error `code`, redacted message ve `SourceSpan` taşır. NOX exception inheritance modeliyle uyum proof gerektirir.

### 16.2. Kullanım senaryosu (API taslağı, derlenebilir kod iddiası yok)

```text
loader = MemoryLoader({"pages/hello.html": "<h1>Hello {{ user.name }}</h1>"})
env = Environment(loader, options=html_safe_defaults())
tpl = env.get_template("pages/hello.html")
ctx = Context.from_json('{"user":{"name":"<Ada>"}}')
assert env.render(tpl, ctx) == "<h1>Hello &lt;Ada&gt;</h1>"
```

Uygulamaya alınacak imzalar en küçük `.nox` dosyasında `noxc check` + `noxc run` ile onaylanır. İmza adları `nox.json` paket alias'ıyla uyumlu olacaktır.

### 16.3. İstemci bağlama noktaları

- `Environment`: immutable policy/options/loader/registry, shared compile cache.
- `Template`: immutable AST/IR + name + dependency graph + source version.
- `Context`: immutable/duruma özgü typed values, explicit locale/safe marker.
- `RenderOptions`: output mode, resource limits, strict-undefined, locale, trust tier.
- `GlyphWriter`: `write(chunk)` + `flush()`/`close()` sözleşmesi; cancellation ve partial writer failures typed.
- `Diagnostic`: stable code/severity/logical_name/start/end/hint; source excerpt redaction policy.
- `TemplateInfo`: referenced variables, blocks, includes, macros, dependencies ve compile-time hints.

---

## 17. NOX ekosistemi entegrasyonları

### 17.1. Nyx

- Adaptör: `glyph-nyx` ya da `integrations/nyx`, Nyx'in modelinden typed view-model/context üretir.
- `nyx.view.render` mevcut API'si değiştirilmez. Yeni örn. `glyph_nyx.render_view(...)` ile explicit opt-in.
- HTTP `Content-Type`, status code, CSP nonce/headers, streaming HTTP response lifecycle **Nyx/HTTP katmanı** tarafından yönetilir.
- Nyx layout/partial mekanizmaları ile Glyph `extends/include` arasında döngü veya çift escaping olmayacak.
- `nyx.ctrl.render(...)` için adaptör örneği ayrı package/feature; temel `glyph` hiçbir `nyx` import etmez.
- Existing Nyx view'larda otomatik Jinja uyumu iddiası yok; migrasyon tarayıcı ve dönüşüm kılavuzu ekle.

### 17.2. Aether

- Aether content negotiation'a göre `text/html`, `text/plain`, `application/xml` yanıtı oluşturmak için açık adaptör.
- JSON API yanıtı `nox.json` serializer'ı üzerinden; template'le JSON dize birleştirme varsayılan yol değil.
- Request/authorization bilgileri otomatik global template değişkeni olmaz.

### 17.3. Aura

- Aura UI widget ağacı **Glyph ile oluşturulmaz**. Yalnızca kullanıcıya gösterilecek metin, HTML export, e-posta ve statik doküman üretiminde adaptör.
- Cross-target WASM/mobile kapasite matrisi ayrı test edilir; OS filesystem/network zorunluluğu yok.

### 17.4. Diğer kütüphaneler

- **Noxen:** typed view-model validation/adapters; optional dependency.
- **Feather/Atlas:** host veri hazırlayıp `Value`'ya dönüştürür; template DB sorgusu çalıştırmaz.
- **Vault:** config/secrets loader'a değil host'a aittir; secret'ları template context'e verme.
- **Obsidian:** redacted structured diagnostics/log sink; core logging dependency değil.
- **Pulse:** compile/render duration, error counts, cache hit/miss; PII içermeyen metrikler, no content logging.
- **Rune:** `glyph` CLI skeleton, typed command parsing; optional adapter.
- **Ember:** job içinde offline rapor/e-posta render; job retry/idempotency Glyph'in sorumluluğu değildir.
- **Chronos:** schedule ile template üretimi; clock explicit geçirilir.
- **Cipher/Sentinel:** template verileri için auth kararını host/Sentinel verir; Glyph auth implement etmez.
- **Nox Nexus:** WASM/isolated host için MemoryLoader ve düşük limits; security isolation host sorumluluğunda.

---

## 18. CLI ve geliştirici deneyimi

Önerilen komut adı `glyph`; gerçekten `nox.json` `bin` desteği ve Rune entegrasyonu test edilmeden mevcut komutmuş gibi belgelemeyin.

```text
glyph check <template-or-directory> [--root ...] [--format human|json]
glyph lint <path> [--strict] [--policy ...]
glyph render <template> --root <dir> --context <file.json> [--mode html|text]
glyph inspect <template> --root <dir>
glyph deps <template> --root <dir>
glyph bench <fixture> [--iterations N]
glyph version
```

- `--context` JSON dışında arbitrary script, shell veya Python expression almaz.
- `render` stdout'a yazarken secret redaction garanti edilemiyorsa CLI uyarır ve gereken explicit mode kullanır.
- Exit codes kararlı sınıflandırılır: `0 OK`, `2 usage`, `3 syntax`, `4 missing/loader`, `5 security`, `6 resource`, `7 runtime`, `8 internal` (öneri, test ile kesinleştir).
- `--format json` ile stable diagnostic schema, editor/tooling entegrasyonu; stdout ve stderr ayrımı.
- Syntax highlighting için tree-sitter grammar/editör kuralları (ADV); NOX LSP'ye upstream değişiklik varsayılmadan template file association.
- Dev hata ekranında source excerpt ve underline; production'da yalnızca güvenli hata kodu.
- CLI kılavuzunda Windows PowerShell, Linux ve macOS eşdeğer komutlar.

---

## 19. Observability ve operatör deneyimi

- Compiler: parse duration, ast node count, cache hit/miss, compile failure type.
- Renderer: duration, output bytes, operation count, max depth, limit errors.
- Loader: source origin type (memory/fs), load latency, file hit/miss; **physical path/content** default loglanmaz.
- Trace spans: `glyph.compile`, `glyph.load`, `glyph.render`, `glyph.include`, `glyph.macro` (Pulse/OpenTelemetry opt-in).
- Telemetry etiketleri bounded cardinality; template adı canonical/allowlisted ya da hashed. Tenant id, user content, email, token loglanmaz.
- Logging sink injection; core global logger yok. Metrics default off veya test-verified low-overhead noop.
- Error code stable ve güvenli; debug mode sadece trusted dev.

---

## 20. Hata modeli ve diagnostics

Her hata şu alanlarla temsil edilmeli (NOX yeteneğine göre class/enum):

```text
code, category, logical_template_name, line, column,
span_start_byte, span_end_byte, message, safe_hint,
related_spans[], cause_code, render_phase
```

- UI/CLI için stable `GLYPH_SYNTAX_UNCLOSED_BLOCK`, `GLYPH_EVAL_UNDEFINED`, `GLYPH_SECURITY_CONTEXT`, `GLYPH_LIMIT_OUTPUT`, `GLYPH_LOADER_OUTSIDE_ROOT` gibi machine-readable codes.
- Public hata içinde `context` değerleri, secret'lar, dosya içeriğinin tamamı, absolute path, private key, environment variable yok.
- Nested includes/macros hata trace'i `logical_name:line:col` zinciriyle ama sınırlandırılmış derinlikte.
- Parser aynı input için aynı hata önceliğini verir; source byte offset Unicode ile test.
- Diagnostics kayıtları `no stderr panic` ilkesine uyar: library caller'a typed error döndürür/raise eder; CLI stderr'e çevirir.

---

## 21. Test stratejisi (zorunlu)

### 21.1. Çalıştırma

Her test gerçek NOX programı olmalı; `noxc test` için `*_test.nox` dosyaları kullan. `nox.test` assert fonksiyonlarını, gerekiyorsa TestSuite + JUnit kullan. Harici test orchestration olabilir ancak çekirdek doğrulamasını Python mock'larıyla ikame etme.

### 21.2. Katmanlar

1. **Lexing:** delimiter collision, quoted `}}`, raw/comment, CRLF, UTF-8, unexpected EOF.
2. **Parser:** tüm node çeşitleri, operator precedence, nesting, max depth, error recovery.
3. **Expression:** truthiness matrix, equality/type mismatches, short-circuit, numeric overflow, null/undefined.
4. **Value:** JsonValue conversion, large integers, Unicode, map/list, trusted marker propagation.
5. **Rendering:** golden exact output, blocks/loops/filter chain, context shadowing, output limits.
6. **Composition:** extends/include/macros/caller, overrides, super(), cycle, missing dependency.
7. **Safety:** XSS adversarial corpus (10. bölüm), path isolation, helper trust, cache mixing.
8. **Cache:** source change, policy change, registry change, tenant isolation, concurrent compilation.
9. **Writer:** chunking, partial failures, cancellation, backpressure, no double close.
10. **Locale:** Turkish case, fallback, translations, plural, number/date format, escaping.
11. **Ecosystem:** Nyx/Aether contract fixture, standalone consumer package lock build.
12. **Cross-platform:** native Linux/macOS/Windows, LLVM/QBE where supported, WASM memory loader.

### 21.3. Property-based, fuzz, mutation

- Randomly generated valid AST → serialize → parse → render equivalence (roundtrip limits açık).
- Arbitrary bytes → lexer/parser panic/OOM/no hang; budget enforcement.
- Expression AST → evaluator vs small trusted reference semantics (reference engine projeye dahil, Python runtime dependency değil).
- Escaper için Unicode + random HTML payload, double-escaping ve idempotence property'lerini bağlam bazında tanımla.
- Parser mutants ve security mutants testlerin yakaladığı kanıtlanmalı.
- Golden fixture snapshot güncellemesi ayrı gerekçe ve insan review; başarısız testte çıktıyı körlemesine golden'a yazma.

### 21.4. Hedef kalite kapıları

- Her public feature için en az bir positive, bir negative test ve dependency/security boundary varsa adversarial test.
- Kritiklik yüksek security paths: %100 tanımlı saldırı corpus'u beklenen sonucu verir; coverage rakamı güvenlik garantisi değildir.
- Hedef genel statement/branch coverage (ölçülebiliyorsa) >=%85, parser+escaping+loader >=%95; mümkün değilse belgelenmiş eşdeğer manuel branch matrisi.
- CI'da `noxc check`, `noxc test`, örnek consumer build ve regression suite yeşil olmadan PR merge yok.
- Release için sızıntı/overflow/panic/OOM stres testleri, kaynak limitleri ve cross-backend evidence.

---

## 22. Benchmark ve performans hedefleri

Rakip karşılaştırması pazarlama değil, tekrar üretilebilir deneydir. `nox.template`, kendi Glyph vN, isteğe bağlı Jinja2/Go template gibi dış baseline ayrı araç olabilir; benchmark çalıştırmak için Glyph'e Python bağımlılığı eklenmez.

| Senaryo | Ölçüm |
|---|---|
| Küçük template (1-10 substitutions) | compile latency, warm render p50/p95 |
| Döngü 10/1.000/100.000 item | throughput, allocations, peak RSS |
| 3/10 kat inheritance | dependency load ve render latency |
| Nested include/macro | depth, stack/memory growth |
| Contextual escape ağır workload | throughput vs text mode |
| Memory/FS loader cold/warm | hit rate, invalidation |
| Concurrent 1/4/16/64 renders | data race, throughput, tail latency |
| Writer 1KB/1MB/16MB | partial chunks, memory overhead |
| WASM/browser memory loader | compiled size, runtime CPU/memory |

- İlk hedef güvenli doğruluk; ölçüm görmeden 'Jinja2'den hızlı' iddiası yok.
- En az 3 bağımsız koşu, pinned compiler/release/profile, host CPU/RAM/OS, fixture ve commit hash kaydı.
- Perf regression budget tasarım önerisi: eşdeğer fixture'larda >%15 yavaşlama inceleme gerektirir; bu bir SLO garantisi değildir.
- Cache performansını soğuk ve sıcak olarak ayrı raporla; cache ile riskli policy bypass etme.
- O(n²) string construction testleri özellikle büyük loop'ta ölçülecek.

---

## 23. CI, sürüm, paketleme ve tedarik zinciri

- `nox.json` isim `glyph`, entry/package alanı doğru; `nox.lock` commit'e girer. Tüm transitive dependencies SHA ile pinlenir.
- Target minimum compiler versiyonu en az bir exact release tag'ine pinlenir; nightly üzerinde çalışması stable destek sayılmaz.
- CI matrix: Linux x64, macOS arm64 (veya erişilebilir mimari), Windows x64; LLVM/QBE varyantları; WASM profile smoke (doğrulanmışsa).
- PR stages: lint/static check → unit → parser fuzz smoke → security → integration → examples → benchmarks (nightly) → packaging.
- Build artefact'larını release imzası/provenance/SBOM ile yayımla; mümkünse `noxc sign`/`noxc sbom` resmî akışından yararlan.
- Dependency taraması, license ve vulnerability review; cryptographic crypto reimplementation yok.
- `CHANGELOG.md` SemVer; breaking syntax/escaping değişiklikleri MAJOR. Security default'un gevşetilmesi breaking + ayrıca yasak değişiklik prosedürü.
- Package registry yayın komutları docs'a göre `noxc login` / `noxc publish`; repo CI'da publish onay gerektirir, otomatik secrets loglanmaz.
- Published artifact immutable tag; runtime/stdlib ABI'ye karşı binary cache garantisi yok; Nox kaynakla birlikte yeniden derlenen program modeline uy.
- Kararlı public API grupları `Stable`, `Experimental`, `Deprecated`, `Internal` ayrı etiketlenir; geçiş kılavuzu ve minimum deprecation window.

---

## 24. Faz bazlı geliştirme yol haritası

### Faz 0 — Feasibility / gerçek NOX capability audit

**İşler:** compiler lock/version, stdlib API proofs, `JsonValue` conversion, tagged nodes, callbacks, map/list/enum semantics, error classes, package import, FilesystemLoader sandbox, Nyx adapter sketch, WASM smoke. `docs/compatibility.md`, ADR-0001 ve `docs/roadmap.md` oluştur.

**Kabul:** En az bir `glyph` paketi consumer'ı `.nox` olarak derlenir; hello-world nox.test yeşil; safety/path assumptions kayda geçirilir. Eksik capability için workaround veya deferred işaretlenir.

### Faz 1 — Value / Core / Lexer

**İşler:** typed Value, SourceSpan, Token types, delimiter scanner, comments/raw, string/number literal, malformed input hata modeli, ResourceBudget skeleton.

**Kabul:** Token fixtures deterministik; Unicode byte ve line offsets doğru; invalid template parser'a ulaşmadan kontrollü hata; bounded input fuzz smoke.

### Faz 2 — Parser / Expressions / Validation

**İşler:** Pratt parser, AST, `if/elif/else`, for, set, output, safe registry calls, literal collection, scope analysis ve static checks.

**Kabul:** Precedence tablosu, truthiness/type errors, recursion limit ve malformed nesting %100 fixtures; template içinde NOX/OS I/O çalıştırma mümkün değil.

### Faz 3 — Renderer / HTML safety / Limits (MVP v0.1 hedefi)

**İşler:** Context, writer, basic filters/tests, default escaping, HTML text/quoted attribute policy, limits, MemoryLoader, compiled string API, docs/examples.

**Kabul:** XSS baseline ve bütçe sınırı testleri; HTML `"<Ada>" -> "&lt;Ada&gt;"`; reusable Template; render contamination yok; v0.1 release checklist.

### Faz 4 — Loaders / Include / Cache

**İşler:** FS safe loader, includes with/without context, dependency graph, parse/compile cache, fingerprint/invalidation, cache quotas, path/cycle tests.

**Kabul:** `..`/symlink/sibling escape engellenir; source update cache invalidate eder; policy/tenant cache mix yok.

### Faz 5 — Inheritance / Blocks / Macros

**İşler:** extends, block override, super, macro default/keyword args, import/from import, caller, nested scopes.

**Kabul:** Blog layout örneği eksiksiz; duplicate/cycle/undefined fail; macro security label korunur.

### Faz 6 — Contextual escaping / Security hardening

**İşler:** HTML tokenizer context tracker, URL attribute policy, JS/CSS unsafe-context denial, TrustedMarkup semantics, restricted templates, redacted diagnostics, adversarial corpus.

**Kabul:** Unsafe contexts varsayılan reddedilir; bütün security fixtures yeşil; documented threat model ve SECURITY.md.

### Faz 7 — Built-in filters/tests / Extensibility

**İşler:** full approved builtin filter/test catalog, typed registry, cost metering, override policy, helper context ve filter docs.

**Kabul:** Her filtre için type/edge/locale/security/limit testleri; untrusted context helper ile OS erişimi yok.

### Faz 8 — i18n / Outputs / Streaming

**İşler:** locale/catalog/fallback, date/number formatları (doğrulanmış subset), HTML/text/XML/email modes, writer streaming, cancellation integration.

**Kabul:** Türkçe case, plural fallback fixtures; output modes secret/HTML boundaries; 16MB output test controlled; streamed vs buffered identical.

### Faz 9 — Nyx / Aether / CLI / Tooling

**İşler:** Nyx opt-in render adapter, Aether content-type adapter, Rune CLI, developer lint/check/diagnostic JSON, docs/examples.

**Kabul:** Bağımsız core Nyx import etmez; gerçek Nyx örneği build/run; API typed contract; eski Nyx render behavior unchanged.

### Faz 10 — Production hardening / Cross-platform

**İşler:** race/cache stress, parser fuzz corpus, benchmark baselines, limits tuning, platform CI, WASM memory loader, release pipeline, docs review.

**Kabul:** Platform matrisi yeşil; no untriaged critical security defects; AGENTS release checklist; v1.0 readiness review.

### Faz 11 — Advanced v1.x / v2 araştırma

**İşler:** component/slot DSL, advanced filters, static analyzer/editor grammar, streaming async adapters, optional AOT compile-to-NOX, restricted multi-tenant execution research.

**Kabul:** Her ADV proje için ayrı ADR, security model, compatibility proof, benchmark ve API versioning. v1.0'ın güvenlik kuralları korunur.

---

## 25. Her faz için çıktı checklist'i

- [ ] Kapsam, riskler ve kabul kriterleri `docs/roadmap.md`de belirtilmiş.
- [ ] Minimum compiler sürümünde type-check ve test çalışıyor.
- [ ] Ürünün yeni public API'si `docs/api.md`de yer alıyor.
- [ ] Başarı, hata, sınır ve kötüye kullanım testleri mevcut.
- [ ] Loader/cache/concurrency değişikliğinde isolation testi var.
- [ ] HTML/URL/JS/context değişikliğinde security corpus genişletildi.
- [ ] Golden snapshot bilinçli ve belgeli güncellendi.
- [ ] Yeni örnek gerçek `noxc run` ile doğrulandı.
- [ ] Benchmarks önemli hot-path değişikliğinde ölçüldü.
- [ ] `CHANGELOG.md` ve gerekiyorsa ADR güncellendi.
- [ ] Stable/Experimental/Planned durumları dürüstçe işaretlendi.
- [ ] Diff, README ve dependency direction gözden geçirildi.

---

## 26. ADR mekanizması ve mimari karar sırası

ADR biçimi: `docs/adr/NNNN-kisa-baslik.md`.

İçerik: problem, önceki kararlar, gereksinimler, NOX capability proof, alternatifler, güvenlik/performans değerlendirmesi, karar, rejected options, migrasyon, kabul kriterleri, tarih, durum.

**Öncelikli ADR listesi:**

1. ADR-0001: Minimum NOX sürümü ve Value node temsili.
2. ADR-0002: Expression grammar + operator precedence + truthiness.
3. ADR-0003: Contextual HTML escaping / unsafe contexts.
4. ADR-0004: `TrustedMarkup` provenance ve `safe` filtresi politikası.
5. ADR-0005: Loader root / FS TOCTOU destek sınırı.
6. ADR-0006: Macro scope, call/caller, includes context.
7. ADR-0007: Cache invalidation and tenant/policy isolation.
8. ADR-0008: Streaming writer / partial response error semantics.
9. ADR-0009: Locale catalog/plural format.
10. ADR-0010: Nyx adapter ve migration rules.
11. ADR-0011: Template AOT code generation fizibilitesi.
12. ADR-0012: User-created templates threat model/isolation.

Uyuşmazlıkta karar sırası: **güvenlik invariants > derlenen NOX gerçeği > belgelenmiş public contract > ADR > roadmap > öneri**. Güvenlik gevşetme veya compiler değiştirme isteği kullanıcı kararı gerektirir.

---

## 27. Definition of Done / v1.0 release gate

`v1.0` yayımlanabilmesi için:

1. `noxc check` ve `noxc test` tüm core/consumer örneklerinde başarıyla çalışmış.
2. Lexical grammar, expression precedence, error semantics ve Value conversions belgeli ve testli.
3. Autoescape, contextual deny-by-default, URL scheme filtering ve trusted label politikası uygulamalı.
4. Include/extends/block/macro temel composition hatasız.
5. Memory/Filesystem loader ve compile cache root/trust/policy izolasyonlu.
6. Bounded resource controls bütün render yolunu ve helper'ları kapsıyor.
7. Golden, security, fuzz, concurrency ve regression testleri raporlanmış; kritik açık yok.
8. Nyx opt-in adapter gerçek paket/example üzerinden doğrulanmış, core bağımsız kalmış.
9. Cross-platform destek iddiaları CI loglarıyla eşleşiyor; WASM destek sınırları dürüst.
10. Docs: syntax, security, API, migration, how-to, examples, limitations, versioning, changelog, license tamam.
11. Benchmarklar karşılaştırılabilir ortamlarda ve tekrar üretilebilir script ile yayımlanmış.
12. Dependency lock, signed/provenance release mekanizması ve güvenlik bildirim kanalı mevcut.
13. Stable public API, SemVer policy ve deprecation yöntemi kararlaştırılmış.
14. Bilinmeyen context'e output yazılmıyor; template text ile process/system komutları yürütülemiyor.
15. Release review, bir ajan tarafından 'tamamlandı' diye iddia edildiği için değil, **çalıştırılmış kanıt ve karar kayıtlarıyla** onaylanmış.

---

## 28. Her görev sonrası ajan rapor biçimi

Ajan görevi bitirdiğinde kısa ama denetlenebilir biçimde aşağıdakileri verir:

```text
Görev/Faz:
Durum: done | partial | blocked
Değiştirilen dosyalar:
Uygulanan API ve gerçek NOX sürümü:
Çalıştırılan komutlar:
Testler: N geçti / M kaldı (kanıt)
Güvenlik etkisi ve testleri:
Performans etkisi (ölçülen / ölçülmedi):
Kalan riskler / known limitations:
Roadmap/ADR/CHANGELOG güncellemeleri:
Sıradaki en küçük uygulanabilir iş:
```

**Asla yapılmayacaklar:** Compile edilmemiş pseudocode'u uygulama diye sunmak; pythonic API'yi otomatik NOX uyumlu sanmak; testsiz `safe/raw` eklemek; render sonucu HTML'nin güvenli olduğunu regex ile varsaymak; dış bağımlılıkları gizlemek; dead code ile test geçiyormuş gibi göstermek; riskli dosya okuma/uzaktan fetch'i varsayılan açmak; release gate'i yapay olarak geçmek.

---

## 29. İlk geliştirilecek minimum vertical slice

**F0-F3 için şu örnek tüm sistemin ortak hedefidir:**

```jinja2
<h1>{{ title }}</h1>
<ul>
{% for item in items %}
  {% if item.visible %}<li>{{ item.name | upper }}</li>{% endif %}
{% endfor %}
</ul>
```

`title="<Welcome>"` ve `item.name="<script>alert(1)</script>"` gibi veriyle render, HTML metin bağlamında güvenli escaping uygulamalıdır. `items` typed list/map verisi olmalı; öznitelik erişimi map field lookup'la sınırlı olmalı; output bütçe dışında kalırsa typed limit error dönmeli. Bu örnek henüz Glyph'in çalıştığına dair kanıt değildir, implementation acceptance fixture'ıdır.

İkinci vertical slice (F4-F5): `base.html` + `extends` + `block` + `include` + macro + cache invalidation. Üçüncü (F6-F10): malicious URL/context injection'ı reddeden SSR view + Nyx adapter + streaming writer.

**Ürün pusulası:** *“Nox gibi tipli ve derlenebilir; Jinja2 kadar üretken; varsayılan olarak güvenli; Nyx'e doğal ama hiçbir framework'e bağımlı olmayan bir template engine.”*

# Fantom mobile bug repro — rolling findings

Scope: https://fantom-cline.vercel.app — mobile viewport 375x812, reproduce "меню пропадает при попытке записаться".

Tab: tab-vtab-1341878584 (opened by agent, viewport resized 375x812)

## Environment issue found (IMPORTANT — affects methodology)
`browser_click` dispatches mouse coords as `viewportY - scrollY` instead of `viewportY`.
Proof: at scrollY=800 clicking header burger (viewport y=32) produced event at y=-768;
at scrollY=0 the same click produced y=32 and the menu opened.
=> Real clicks only land correctly when the page is at scrollY=0.
Workaround used: keyboard activation (Shift+Tab / Tab / Enter) or clicks at scrollY=0.

## Steps done
1. Site opens OK. Sticky bottom bar ("Стоимость от 4 500 ₸" + "Забронировать", fixed bottom, class `translate-y-full` when hidden) is HIDDEN at scrollY=0 and at page bottom; SHOWN (rect top 743) at scrollY=800. => appears after scrolling past hero.
2. Tap on sticky "Забронировать" (anchor href="#booking"): first 2 attempts at scrollY=800 did nothing (hash unchanged, scroll unchanged) — explained by the click-coord harness bug above, NOT a site bug. Not yet re-tested with working input method.
3. Burger (button aria-label "Открыть меню") clicked at scrollY=0 => menu opened (aria-expanded=true). Menu = dialog "Меню": label "МЕНЮ", close button "Закрыть меню", nav items КВЕСТЫ / КАК ПРОХОДИТ / ОТЗЫВЫ / КОНТАКТЫ, switch "Включить страшные звуки", red link "ЗАБРОНИРОВАТЬ МЕСТО", phone link. While menu is open the header (banner) is empty in a11y tree => header "ЗАПИСЬ" button not reachable (covered by overlay).
4. Header "Запись" while menu open: not visible, could not be tapped.
5. Tap "ЗАБРОНИРОВАТЬ МЕСТО" in menu => menu CLOSED, location.hash -> #booking, page scrolled to y=4463, booking form visible (step 1/3 "КВЕСТ"). WORKS.
6. Form completion: IN PROGRESS.
7. Menu item "Квесты" scroll test: TODO.

## Console
No JS errors recorded so far (`browser_utility errors` => []).

## Remaining
- item 2 (sticky "Забронировать") re-test with reliable input
- item 6 form fill to submit
- item 7 menu nav item -> section scroll
- screenshots per step

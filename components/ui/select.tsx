"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

/** Pause between keystrokes after which the type-ahead buffer starts over. */
const TYPEAHEAD_RESET_MS = 700;

/**
 * Custom select following the WAI-ARIA "select-only combobox" pattern: the
 * trigger keeps focus and steers the listbox via `aria-activedescendant`;
 * arrows/Home/End move, Enter/Space commit, Escape and outside-click dismiss,
 * and typing jumps to the first matching option.
 *
 * `searchable` swaps the type-ahead for a filter field at the top of the list
 * (for long option sets like the company picker). Focus moves into the field
 * while the list is open; arrows/Enter/Escape steer the filtered options and
 * the trigger regains focus on close.
 *
 * `closeOnSelect={false}` is for pure view-filter pickers (e.g. the billing
 * period): picking applies live but keeps the list open so several options can
 * be tried in one session; only Escape/outside-click/the trigger dismiss it.
 */
export function Select({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Select…",
  disabled = false,
  closeOnSelect = true,
  searchable = false,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
  searchable?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const optionId = (index: number) => `${uid}-option-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ buffer: "", lastKeyAt: 0 });
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [search, setSearch] = useState("");

  // Everything below (active option, ids, commits) indexes this filtered
  // view; without a search term it is simply `options`.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!searchable || !term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, searchable, search]);

  const selectedIndex = visible.findIndex((o) => o.value === value);
  const selected = options.find((o) => o.value === value);

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeList = useCallback(() => {
    // Hand focus back to the trigger if it was parked in the search field, so
    // keyboard users don't get dropped to <body>.
    if (
      searchable &&
      rootRef.current?.contains(document.activeElement)
    ) {
      triggerRef.current?.focus();
    }
    setOpen(false);
    setOpenUp(false);
    setSearch("");
  }, [searchable]);

  const commit = (index: number) => {
    const option = visible[index];
    if (!option) return;
    onValueChange(option.value);
    if (closeOnSelect) closeList();
    else setActiveIndex(index);
  };

  // Flip above the trigger when the viewport has no room below (before paint,
  // so the list never flashes in the wrong place — e.g. the pagination bar).
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = rootRef.current?.getBoundingClientRect();
    const height = listRef.current?.getBoundingClientRect().height;
    if (!trigger || !height) return;
    setOpenUp(
      trigger.bottom + height + 8 > window.innerHeight &&
        trigger.top - height - 8 > 0,
    );
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeList();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, closeList]);

  // Keep the active option visible while arrowing through a scrolled list.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(`${uid}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, uid]);

  const moveActive = (next: (current: number) => number) =>
    setActiveIndex((current) =>
      Math.min(visible.length - 1, Math.max(0, next(current))),
    );

  const searchOptions = (key: string) => {
    const state = typeahead.current;
    const now = Date.now();
    state.buffer =
      now - state.lastKeyAt > TYPEAHEAD_RESET_MS ? key : state.buffer + key;
    state.lastKeyAt = now;

    const term = state.buffer.toLowerCase();
    // A fresh buffer searches *past* the active option so repeating a letter
    // cycles through everything starting with it.
    const from = state.buffer.length === 1 ? activeIndex + 1 : activeIndex;
    for (let step = 0; step < visible.length; step += 1) {
      const index = (Math.max(from, 0) + step) % visible.length;
      if (visible[index].label.toLowerCase().startsWith(term)) {
        setActiveIndex(index);
        return;
      }
    }
  };

  /** Navigation keys shared by the trigger and the search field. */
  const handleNavKey = (e: React.KeyboardEvent): boolean => {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeList();
        return true;
      case "ArrowDown":
        e.preventDefault();
        moveActive((i) => i + 1);
        return true;
      case "ArrowUp":
        e.preventDefault();
        moveActive((i) => i - 1);
        return true;
      case "Enter":
        e.preventDefault();
        commit(activeIndex);
        return true;
      default:
        return false;
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Tab") {
      closeList();
      return;
    }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (
        searchable &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        // Typing on the closed trigger opens the list with the search seeded.
        e.preventDefault();
        openList();
        setSearch(e.key);
        setActiveIndex(0);
      }
      // Enter/Space activate the button → onClick toggles the list open.
      return;
    }
    if (handleNavKey(e)) return;
    switch (e.key) {
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(visible.length - 1);
        break;
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      default:
        if (
          !searchable &&
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          searchOptions(e.key);
        }
    }
  };

  // Home/End (and Space) are left alone here — they belong to the caret.
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      closeList();
      return;
    }
    handleNavKey(e);
  };

  const activeDescendant =
    open && activeIndex >= 0 ? optionId(activeIndex) : undefined;

  return (
    <div ref={rootRef} className={cn("relative h-10 w-fit", className)}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={searchable ? undefined : activeDescendant}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
        className="flex h-full w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-sm text-foreground transition-colors duration-150 hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          className={cn(
            "absolute left-0 z-50 w-max min-w-full max-w-[min(90vw,28rem)] rounded-md border border-border bg-card p-1 shadow-raised motion-safe:animate-dropdown-in",
            openUp ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top",
          )}
        >
          {searchable ? (
            <div className="relative mb-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder="Search…"
                aria-label="Filter options"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                aria-autocomplete="list"
                className="h-8 w-full rounded border border-input bg-surface pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          ) : null}

          <div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            // Pointer leaving the list rests the highlight back on the selected
            // option (like native menus) instead of leaving it wherever the
            // mouse last was.
            onMouseLeave={() => setActiveIndex(selectedIndex)}
            className="max-h-60 overflow-y-auto"
          >
            {visible.length === 0 ? (
              <p className="px-2.5 py-2 text-sm text-muted-foreground">
                No matches.
              </p>
            ) : (
              visible.map((option, index) => (
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={option.value === value}
                  // Keep focus on the trigger/search field so keys keep flowing.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                  className={cn(
                    "scroll-my-1 cursor-pointer rounded px-2.5 py-1.5 text-sm transition-colors duration-75",
                    index === activeIndex && "bg-primary/10",
                    option.value === value && "font-semibold text-primary",
                  )}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* eslint-env browser */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const leagueSel = document.getElementById("league-select");
  const sportSel = document.getElementById("sport-select");
  const leagueHint = document.getElementById("league-hint");
  const leagueLoading = document.getElementById("league-loading");

  async function hydrateLeaguesIfEmpty() {
    try {
      const url = new URL(window.location.href);
      const sport = url.searchParams.get("sport");
      if (!sport) return;
      // If only placeholder option is present, hydrate client-side
      if (leagueSel && leagueSel.options.length <= 1) {
        leagueSel.disabled = true;
        if (leagueLoading) leagueLoading.style.display = "inline-flex";
        if (leagueHint) leagueHint.style.display = "none";
        const resp = await fetch("/api/leagues?sport=" + encodeURIComponent(sport) + "&v=2");
        if (!resp.ok) return;
        const data = await resp.json();
        const leagues = data.data ?? [];
        leagueSel.innerHTML =
          '<option value="">All leagues</option>' +
          leagues
            .map((l) => {
              const country = l.country ? " (" + l.country + ")" : "";
              return '<option value="' + l.id + '">' + l.name + country + "</option>";
            })
            .join("");
        // restore league value from URL if any
        const current = url.searchParams.get("league");
        if (current) leagueSel.value = current;
        leagueSel.disabled = false;
        // Toggle hint based on result
        if (leagueHint) {
          leagueHint.style.display = leagues.length > 0 ? "none" : "block";
        }
      }
    } catch {
      /* ignore */
    } finally {
      if (leagueLoading) leagueLoading.style.display = "none";
    }
  }

  if (sportSel) {
    sportSel.addEventListener("change", (e) => {
      const sport = e.target.value;
      // Reset league select and hint immediately for UX
      if (leagueSel) {
        leagueSel.innerHTML = '<option value="">' + (sport ? "All leagues" : "Choose discipline first") + "</option>";
        leagueSel.disabled = !sport;
      }
      // Do not toggle the hint here to avoid flicker; hydration will decide
      if (sport) window.location.href = "/events/list?sport=" + sport;
      else window.location.href = "/events/list";
    });
    const url = new URL(window.location.href);
    const s = url.searchParams.get("sport");
    if (s) sportSel.value = s;
  }

  if (leagueSel) {
    leagueSel.addEventListener("change", (e) => {
      const url = new URL(window.location.href);
      const sport = url.searchParams.get("sport") ?? "";
      const id = e.target.value;
      if (id) {
        const qs = new URLSearchParams({ sport: sport, league: id }).toString();
        window.location.href = "/events/list?" + qs;
      } else {
        window.location.href = sport ? "/events/list?sport=" + sport : "/events/list";
      }
    });
    const url = new URL(window.location.href);
    const current = url.searchParams.get("league");
    if (current) leagueSel.value = current;
    // Hydrate leagues if SSR did not include them
    hydrateLeaguesIfEmpty();
    // After hydration, adjust hint accordingly (only then decide to show)
    Promise.resolve().then(() => {
      const after = leagueSel.options.length;
      if (leagueHint) leagueHint.style.display = after <= 1 ? "block" : "none";
    });
  }
});

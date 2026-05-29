"""Strip noisy HTML before sending page markup to an LLM for SEO/GEO audits."""

from __future__ import annotations

import re
from copy import deepcopy
from typing import Iterable

from lxml.etree import XPath
from scrapling.parser import Selector

# Removed _HIDDEN_XPATH: SEO audits need to see hidden text to check for 
# keyword stuffing (black-hat SEO) or screen-reader accessibility.

_NOISE_TAGS = frozenset(
    {
        "style",
        # "noscript" removed: <noscript> often contains important fallback images/links.
        "svg",
        "iframe",
        "embed",
        "object",
    }
)

# Only target third-party noise: trackers, ads, chat widgets, and consent banners.
# Removed: breadcrumbs, nav, footer, social, and promos (which contain valuable internal links/keywords).
_BOILERPLATE_HINTS = re.compile(
    r"(?:cookie|gdpr|consent|onetrust|cookiebot|termly|trustarc|"
    r"chat-widget|intercom|drift|hubspot|livechat|zendesk|crisp|"
    r"gtm|google-analytics|googletagmanager|"
    r"ad-slot|advertisement|adsbygoogle|doubleclick)",
    re.I,
)

_EVENT_HANDLER_ATTR = re.compile(r"^on[a-z]+", re.I)

_LD_JSON_TYPE = "application/ld+json"

_HEAD_KEEP_LINK_REL = frozenset(
    {
        "canonical",
        "alternate",
        "icon",
        "shortcut icon",
        "apple-touch-icon",
        "manifest",
        "amphtml",
        "preconnect",
        "dns-prefetch",
    }
)


def _attrib_blob(element) -> str:
    parts: list[str] = []
    element_id = element.get("id")
    if element_id:
        parts.append(element_id)
    classes = element.get("class")
    if classes:
        parts.append(classes if isinstance(classes, str) else " ".join(classes))
    role = element.get("role")
    if role:
        parts.append(role)
    return " ".join(parts)


def _is_ld_json_script(element) -> bool:
    return (
        element.tag == "script"
        and (element.get("type") or "").strip().lower() == _LD_JSON_TYPE
    )


def _is_boilerplate_element(element) -> bool:
    # Removed structural tag and role checks (<nav>, <footer>, navigation, banner) 
    # to preserve internal linking architecture.
    
    blob = _attrib_blob(element)
    if blob and _BOILERPLATE_HINTS.search(blob):
        return True

    return False


def _should_drop_tag(element) -> bool:
    tag = (element.tag or "").lower()
    if tag == "script":
        return not _is_ld_json_script(element)
    if tag in _NOISE_TAGS:
        return True
    if tag == "link":
        rel = (element.get("rel") or "").lower()
        if "stylesheet" in rel or ("preload" in rel and element.get("as") == "style"):
            return True
        parent = element.getparent()
        if parent is not None and (parent.tag or "").lower() == "head":
            rel_tokens = rel.split()
            return not any(r in _HEAD_KEEP_LINK_REL for r in rel_tokens)
    return False


def _strip_attributes(element) -> None:
    drop: list[str] = []
    for name in element.attrib:
        lower = name.lower()
        if lower == "style" or _EVENT_HANDLER_ATTR.match(lower):
            drop.append(name)
    for name in drop:
        del element.attrib[name]


def refine_html_for_seo_audit(html: str, url: str | None = None) -> str:
    """Return audit-focused HTML: metadata, headings, links, images, and JSON-LD only."""
    if not html or not html.strip():
        return html

    page = Selector(html, url=url)
    clean_root = deepcopy(page._root)

    # Pass 1: remove non-JSON-LD scripts, CSS, embeds, and third-party widgets.
    for element in list(clean_root.iter()):
        if _should_drop_tag(element) or _is_boilerplate_element(element):
            element.drop_tree()

    # Pass 2: strip inline CSS and event handlers from surviving nodes.
    # (Hidden node dropping pass was removed to keep accessibility/spam context).
    for element in clean_root.iter():
        if isinstance(element.tag, str):
            _strip_attributes(element)

    refined = Selector(root=clean_root, url=url, keep_comments=False)
    return str(refined.html_content)
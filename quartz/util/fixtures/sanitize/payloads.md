---
title: "Payloads <img src=x onerror=alert(1)>"
description: '"><script>xss-marker</script><img src=x onerror=alert(2)>'
tags:
  - sanitize-fixture
---

Inline image: <img src=x onerror=alert(3)>

<script>alert("xss-marker")</script>

<style>/* xss-marker */ body { display: none }</style>

[markdown link](javascript:alert(4))

<a href="javascript:alert(5)">raw link</a>

<a href="&#106;avascript:alert(6)">entity-encoded link</a>

<iframe srcdoc="<script>alert(7)</script>"></iframe>

<iframe src="javascript:alert(8)"></iframe>

<svg><g onload="alert(9)"></g></svg>

<form action="javascript:alert(10)"><button formaction="javascript:alert(11)">submit</button></form>

<object data="javascript:alert(12)"></object>

<embed src="javascript:alert(13)">

<meta http-equiv="refresh" content="0;url=javascript:alert(14)">

<base href="javascript:alert(15)//">

<details open ontoggle="alert(16)"><summary>summary</summary></details>

<video src=x onerror=alert(17)></video>

<div onclick="alert(18)">clickable</div>

==<img src=x onerror=alert(19)>==

![[target|x" onmouseover="alert(20)]]

> [!note] <img src=x onerror=alert(21)>
> Callout body.

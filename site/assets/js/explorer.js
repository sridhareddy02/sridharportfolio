// Attribution explorer: plots Project 1's real simulation output. Built with DOM nodes only.
(function () {
  var host = document.getElementById("explorer");
  var dataEl = document.getElementById("attribution-data");
  if (!host || !dataEl) return;

  var data;
  try {
    data = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }

  var models = data.models;
  var channels = data.channels;
  var label = {};
  channels.forEach(function (c) { label[c.id] = c.label; });
  var current = "last_touch";

  var btnWrap = host.querySelector("[data-models]");
  var barsEl = host.querySelector("[data-bars]");
  var readout = host.querySelector("[data-readout]");
  var roasBody = host.querySelector("[data-roas]");
  var sourceEl = host.querySelector("[data-source]");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var all = [];
  models.forEach(function (m) { channels.forEach(function (c) { all.push(data.shares[m.id][c.id]); }); });
  channels.forEach(function (c) { all.push(data.truth[c.id]); });
  var scale = Math.ceil(Math.max.apply(null, all) / 5) * 5;

  function signed(n) {
    return (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(1);
  }

  function render() {
    var shares = data.shares[current];
    var model = models.filter(function (m) { return m.id === current; })[0];

    Array.prototype.forEach.call(btnWrap.children, function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-id") === current));
    });

    barsEl.textContent = "";
    var diffs = [];
    channels.forEach(function (c) {
      var s = shares[c.id];
      var t = data.truth[c.id];
      diffs.push({ id: c.id, diff: s - t });
      var li = el("li", "bar-row");
      li.appendChild(el("span", "bar-label", c.label));
      var track = el("div", "track");
      track.setAttribute("role", "img");
      track.setAttribute("aria-label", c.label + ": model credit " + s.toFixed(1) + " percent, true share " + t.toFixed(1) + " percent");
      var fill = el("div", "fill");
      fill.style.width = (s / scale) * 100 + "%";
      var mark = el("div", "truth");
      mark.style.left = (t / scale) * 100 + "%";
      track.appendChild(fill);
      track.appendChild(mark);
      li.appendChild(track);
      li.appendChild(el("span", "bar-value", s.toFixed(1) + "%"));
      barsEl.appendChild(li);
    });

    diffs.sort(function (a, b) { return a.diff - b.diff; });
    var under = diffs[0];
    var over = diffs[diffs.length - 1];
    readout.textContent = "";
    var b1 = el("b", null, model.label);
    readout.appendChild(b1);
    readout.appendChild(document.createTextNode(
      " over-credits " + label[over.id] + " by " + signed(over.diff) + " pp and under-credits " + label[under.id] + " by " + signed(under.diff) +
      " pp. Average error across channels: " + model.mae.toFixed(1) + " pp."
    ));

    roasBody.textContent = "";
    data.roas.forEach(function (r) {
      var tr = el("tr");
      tr.appendChild(el("td", null, label[r.channel]));
      tr.appendChild(el("td", "mono", r.last_touch.toFixed(2)));
      tr.appendChild(el("td", "mono", r.markov.toFixed(2)));
      tr.appendChild(el("td", "mono", r.true.toFixed(2)));
      roasBody.appendChild(tr);
    });
  }

  models.forEach(function (m) {
    var b = el("button", null, m.label);
    b.type = "button";
    b.setAttribute("data-id", m.id);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () {
      current = m.id;
      render();
    });
    btnWrap.appendChild(b);
  });
  sourceEl.textContent = "Simulated data: " + data.source + ". Truth is the exact Shapley contribution; ROAS truth is leave-one-out.";
  render();
})();

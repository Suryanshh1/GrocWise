// =======================================
// GrocWise - Frontend JavaScript
// MongoDB + Express + Socket.IO
// =======================================

// ---------------------------------------
// Configuration
// ---------------------------------------

const API_URL = "http://localhost:5001/api/products";

const PL = [
    { k: 'Blinkit', d: 20, f: 3, h: 4, r: .03, c: 'var(--c1)' },
    { k: 'Zepto', d: 25, f: 2, h: 5, r: .05, c: 'var(--c2)' },
    { k: 'Instamart', d: 15, f: 5, h: 3, r: .02, c: 'var(--c3)' },
    { k: 'BigBasket', d: 30, f: 0, h: 2, r: .04, c: 'var(--c4)' }
];

const CITY = {
    Ludhiana: 1,
    Chandigarh: 1.02,
    Mohali: 1.01,
    Delhi: 1.03,
    Mumbai: 1.08,
    Bengaluru: 1.05
};

// ---------------------------------------
// Socket.IO connection
// ---------------------------------------

const socket = io("http://localhost:5001");

socket.on("connect", () => {
    console.log("Connected to GrocWise Socket.IO:", socket.id);
});

socket.on("disconnect", () => {
    console.log("Disconnected from GrocWise Socket.IO");
});

socket.on("connect_error", error => {
    console.error("Socket.IO connection error:", error.message);
});

// When products change in the backend,
// fetch the latest products and refresh the UI.

socket.on("productsUpdated", async () => {
    console.log("Products changed. Updating GrocWise frontend...");

    await loadProducts();
});

// ---------------------------------------
// Product data
// ---------------------------------------

let PROD = [];

const $ = selector => document.querySelector(selector);

const h = s => {
    let x = 2166136261;

    for (const c of String(s)) {
        x ^= c.charCodeAt(0);
        x = Math.imul(x, 16777619);
    }

    return (x >>> 0) / 4294967295;
};

const rs = n => '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2
});

// ---------------------------------------
// Application state
// ---------------------------------------

const S = {
    tab: 'cmp',
    pid: 0,
    sel: 0,
    city: 'Ludhiana',
    pin: '',
    basket: {},
    watch: []
};

// ---------------------------------------
// Load saved state
// ---------------------------------------

try {
    const v = JSON.parse(localStorage.getItem('gw') || 'null');

    if (v) {
        S.basket = v.basket || {};
        S.watch = v.watch || [];
        S.city = CITY[v.city] ? v.city : S.city;
        S.pin = v.pin || '';
    }
} catch (error) {
    console.error("Could not load saved GrocWise data:", error);
}

// ---------------------------------------
// Save state
// ---------------------------------------

const save = () => {
    try {
        localStorage.setItem('gw', JSON.stringify({
            basket: S.basket,
            watch: S.watch,
            city: S.city,
            pin: S.pin
        }));
    } catch (error) {
        console.error("Could not save GrocWise data:", error);
    }
};

// =======================================
// Backend product loading
// =======================================

async function loadProducts() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.products)) {
            throw new Error("Invalid product data received from API");
        }

        /*
         * The frontend uses array indexes for basket and
         * watchlist keys. MongoDB productId is retained
         * separately for reference.
         */

        const previousProductId = PROD[S.pid]?.productId;

        PROD = data.products.map((product, index) => ({
            id: index,
            productId: product.productId,
            name: product.name,
            qty: product.quantity,
            base: Number(product.basePrice)
        }));

        console.log("Products loaded from API:", PROD);

        // Keep the currently selected product if it still exists
        if (previousProductId !== undefined) {
            const newIndex = PROD.findIndex(
                p => p.productId === previousProductId
            );

            if (newIndex !== -1) {
                S.pid = newIndex;
            } else {
                S.pid = 0;
            }
        }

        // Remove deleted products from the basket
        Object.keys(S.basket).forEach(id => {
            if (!PROD[Number(id)]) {
                delete S.basket[id];
            }
        });

        // Remove deleted products from the watchlist
        S.watch = S.watch.filter(w => PROD[Number(w.id)]);

        // Keep saved state synchronized
        save();

        // Refresh search suggestions
        if (typeof setupSearchSuggestions === "function") {
            setupSearchSuggestions();
        }

        // Refresh current view
        if (typeof render === "function") {
            render();
        }

        return PROD;

    } catch (error) {
        console.error("Failed to load products:", error);

        if ($('#main')) {
            $('#main').innerHTML = `
                <div class="card empty">
                    Unable to load products from the server.
                    Please make sure the GrocWise backend is running.
                </div>
            `;
        }

        return [];
    }
}

// =======================================
// Price engine
// =======================================

const loc = () => S.city + S.pin;

function price(p, pi, day) {
    const m = CITY[S.city] * (1 + (h(S.pin) - .5) * .02);

    const now = p.base * m * (
        .94 + .16 * h(p.name + PL[pi].k + loc())
    );

    if (day === 29) {
        return Math.round(now * 100) / 100;
    }

    const w =
        Math.sin(day / 4.2 + h(p.name) * 6) * .045 +
        (h(p.name + pi + day) - .5) * .05;

    return Math.round(now * (1 + w) * 100) / 100;
}

function obs(p, pi) {
    const pl = PL[pi];
    const P = price(p, pi, 29);

    const C = Math.round(
        P * pl.r * h(p.name + 'd' + pi) * 2 * 100
    ) / 100;

    return {
        pl,
        P,
        C,
        D: pl.d,
        F: pl.f,
        H: pl.h,
        eff: Math.round((P + pl.d + pl.f + pl.h - C) * 100) / 100,
        net: P - C,
        fee: pl.d + pl.f + pl.h
    };
}

const hist = (p, pi) =>
    Array.from({ length: 30 }, (_, d) => price(p, pi, d));

function deal(hs) {
    const n = hs.length;
    const cur = hs[n - 1];

    const avg = a =>
        a.reduce((x, y) => x + y, 0) / a.length;

    const st = {
        min: Math.min(...hs),
        max: Math.max(...hs),
        a7: avg(hs.slice(-7)),
        a30: avg(hs)
    };

    const r = cur / st.a30;

    st.label = r <= .92 ? 'Excellent'
        : r <= .98 ? 'Good'
        : r <= 1.04 ? 'Normal'
        : 'High';

    st.text = {
        Excellent: 'Excellent deal',
        Good: 'Good deal',
        Normal: 'Normal price',
        High: 'High price'
    }[st.label];

    st.pct = Math.round((r - 1) * 100);

    return st;
}

const findP = q => {
    q = q.trim().toLowerCase();

    return PROD.find(p => p.name.toLowerCase() === q)
        || PROD.find(p => p.name.toLowerCase().includes(q));
};

// =======================================
// Price history chart
// =======================================

function chart(p) {
    const W = 640;
    const H = 230;
    const L = 44;
    const B = 24;
    const T = 10;
    const R = 10;

    const all = PL.map((_, i) => hist(p, i));
    const flat = all.flat();

    let lo = Math.min(...flat);
    let hi = Math.max(...flat);

    const pad = (hi - lo) * .1 || 1;

    lo -= pad;
    hi += pad;

    const x = i =>
        L + i * (W - L - R) / 29;

    const y = v =>
        T + (hi - v) * (H - T - B) / (hi - lo);

    let s = `
        <svg viewBox="0 0 ${W} ${H}"
             role="img"
             aria-label="30-day price history for ${p.name}">
    `;

    for (let k = 0; k < 4; k++) {
        const v = lo + (hi - lo) * k / 3;

        s += `
            <line
                x1="${L}"
                x2="${W - R}"
                y1="${y(v)}"
                y2="${y(v)}"
                stroke="var(--line)"
            />

            <text
                x="${L - 6}"
                y="${y(v) + 4}"
                text-anchor="end"
                font-size="11"
                fill="var(--mute)"
            >${Math.round(v)}</text>
        `;
    }

    s += `
        <text
            x="${L}"
            y="${H - 5}"
            font-size="11"
            fill="var(--mute)"
        >30 days ago</text>

        <text
            x="${W - R}"
            y="${H - 5}"
            font-size="11"
            text-anchor="end"
            fill="var(--mute)"
        >Today</text>
    `;

    all.forEach((a, i) => {
        const on = i === S.sel;

        s += `
            <polyline
                fill="none"
                stroke="${PL[i].c}"
                stroke-width="${on ? 3.2 : 1.4}"
                opacity="${on ? 1 : .55}"
                points="${a.map((v, d) => x(d) + ',' + y(v)).join(' ')}"
            />
        `;
    });

    return s + '</svg>';
}

// =======================================
// Compare view
// =======================================

function viewCmp() {
    const p = PROD[S.pid];

    if (!p) {
        return `<div class="card empty">Product not found.</div>`;
    }

    const O = PL.map((_, i) => obs(p, i));

    const best = Math.min(...O.map(o => o.eff));
    const worst = Math.max(...O.map(o => o.eff));

    const hs = hist(p, S.sel);
    const D = deal(hs);

    const watched = S.watch.find(w => w.id === p.id);

    return `
        <div class="card">
            <div class="row">
                <div>
                    <h2>${p.name}</h2>

                    <div class="mute">
                        ${p.qty} · ${S.city}${S.pin ? ' ' + S.pin : ''}
                    </div>
                </div>

                <div class="row">
                    <button class="btn alt" data-a="add">
                        Add to basket
                    </button>

                    <span class="row" style="gap:6px">
                        <input
                            class="field target"
                            id="tg"
                            type="number"
                            min="1"
                            placeholder="Target ₹"
                            value="${watched ? watched.t : ''}"
                            aria-label="Target price">

                        <button class="btn" data-a="watch">
                            ${watched ? 'Update alert' : 'Watch price'}
                        </button>
                    </span>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Platform</th>
                            <th>Price</th>
                            <th>Delivery</th>
                            <th>Platform fee</th>
                            <th>Handling</th>
                            <th>Discount</th>
                            <th>You pay</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${O.map((o, i) => `
                            <tr
                                class="pick ${i === S.sel ? 'sel' : ''}"
                                data-sel="${i}"
                                tabindex="0">

                                <td>
                                    <span
                                        class="dot"
                                        style="background:${o.pl.c}">
                                    </span>

                                    ${o.pl.k}

                                    ${o.eff === best
                                        ? '<span class="best">Cheapest</span>'
                                        : ''}
                                </td>

                                <td>${rs(o.P)}</td>
                                <td>${rs(o.D)}</td>
                                <td>${rs(o.F)}</td>
                                <td>${rs(o.H)}</td>
                                <td>−${rs(o.C)}</td>
                                <td class="eff">${rs(o.eff)}</td>
                            </tr>
                                        `).join('')}
                    </tbody>
                </table>
            </div>

            <p class="mute" style="margin:12px 0 0">
                You pay = price + delivery + platform fee + handling − discount.
                Choosing the cheapest saves ${rs(worst - best)} on this item.
            </p>
        </div>

        <div class="card">
            <div class="row">
                <h3>30-day price · ${PL[S.sel].k}</h3>

                <span class="badge ${D.label}">
                    ${D.text}
                    ${D.pct
                        ? ` (${D.pct > 0 ? '+' : ''}${D.pct}% vs 30-day avg)`
                        : ''}
                </span>
            </div>

            <div style="margin-top:10px">
                ${chart(p)}
            </div>

            <div class="chips">
                ${PL.map(q => `
                    <span class="mute">
                        <span class="dot" style="background:${q.c}"></span>
                        ${q.k}
                    </span>
                `).join('')}
            </div>

            <div class="stats">
                ${[
                    ['Lowest', D.min],
                    ['Highest', D.max],
                    ['7-day avg', D.a7],
                    ['30-day avg', D.a30]
                ].map(([a, b]) => `
                    <div class="stat">
                        <span class="mute">${a}</span>
                        <b>${rs(b)}</b>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// =======================================
// Basket optimization
// =======================================

function optimise() {
    const ids = Object.keys(S.basket).map(Number);
    const items = ids.map(i => PROD[i]).filter(Boolean);

    if (!items.length) {
        return {
            items: [],
            single: null,
            split: null
        };
    }

    const cost = items.map(p =>
        PL.map((_, pi) =>
            obs(p, pi).net * S.basket[p.id]
        )
    );

    let single = null;

    PL.forEach((pl, pi) => {
        const total =
            cost.reduce((sum, c) => sum + c[pi], 0) +
            obs(items[0], pi).fee;

        if (!single || total < single.t) {
            single = {
                t: total,
                pi
            };
        }
    });

    let best = null;

    const n = items.length;
    const assignment = Array(n).fill(0);

    (function go(i) {
        if (i === n) {
            const used = new Set(assignment);
            let total = 0;

            assignment.forEach((pi, k) => {
                total += cost[k][pi];
            });

            used.forEach(pi => {
                total += obs(items[0], pi).fee;
            });

            if (!best || total < best.t) {
                best = {
                    t: total,
                    as: [...assignment]
                };
            }

            return;
        }

        for (let pi = 0; pi < PL.length; pi++) {
            assignment[i] = pi;
            go(i + 1);
        }
    })(0);

    return {
        items,
        single,
        split: best
    };
}

// =======================================
// Basket view
// =======================================

function viewBsk() {
    const ids = Object.keys(S.basket).map(Number);

    if (!ids.length) {
        return `
            <div class="card empty">
                Your basket is empty. Search for a product and choose
                “Add to basket” to compare a full order.
            </div>
        `;
    }

    if (ids.length > 8) {
        return `
            <div class="card empty">
                Baskets are limited to 8 products. Remove some items.
            </div>
        `;
    }

    const o = optimise();

    if (!o.items.length) {
        return `
            <div class="card empty">
                Your basket is empty.
            </div>
        `;
    }

    const sv = o.single.t - o.split.t;
    const sp = new Set(o.split.as).size > 1;

    return `
        <div class="card">
            <h3>Basket</h3>

            ${o.items.map(p => `
                <div class="item">
                    <div>
                        <b>${p.name}</b>
                        <span class="mute">${p.qty}</span>
                    </div>

                    <div class="qty">
                        <button
                            data-q="${p.id}"
                            data-n="-1"
                            aria-label="Less">−</button>

                        ${S.basket[p.id]}

                        <button
                            data-q="${p.id}"
                            data-n="1"
                            aria-label="More">+</button>

                        <button
                            class="btn alt"
                            data-rm="${p.id}">
                            Remove
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="grid2">

            <div class="card ${sp ? '' : 'win'}">
                <div class="mute">Cheapest single platform</div>

                <h3>${PL[o.single.pi].k}</h3>

                <div class="big">${rs(o.single.t)}</div>

                <div class="mute">One set of order fees</div>
            </div>

            <div class="card ${sp ? 'win' : ''}">
                <div class="mute">Best split across platforms</div>

                <h3>
                    ${sp ? 'Split order' : 'Same as single platform'}
                </h3>

                <div class="big">${rs(o.split.t)}</div>

                ${sp
                    ? `<div class="save">Saves ${rs(sv)} over one platform</div>`
                    : `<div class="mute">Splitting would not save money here</div>`
                }
            </div>

        </div>

        ${sp ? `
            <div class="card">
                <h3>Where to buy each item</h3>

                ${o.items.map((p, k) => `
                    <div class="item">
                        <span>${p.name}</span>

                        <b>
                            <span
                                class="dot"
                                style="background:${PL[o.split.as[k]].c}">
                            </span>

                            ${PL[o.split.as[k]].k}
                        </b>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

// =======================================
// Watchlist view
// =======================================

function viewWl() {
    if (!S.watch.length) {
        return `
            <div class="card empty">
                No alerts yet. Open a product, enter a target price
                and choose “Watch price”.
            </div>
        `;
    }

    return `
        <div class="card">
            <h3>Price alerts</h3>

            ${S.watch.map(w => {
                const p = PROD[w.id];

                if (!p) return '';

                const O = PL.map((_, i) => obs(p, i));

                const m = O.reduce((a, b) =>
                    b.eff < a.eff ? b : a
                );

                const hit = m.eff <= w.t;

                return `
                    <div class="item">
                        <div>
                            <b>${p.name}</b>

                            <span class="mute">${p.qty}</span>

                            <div class="mute">
                                Target ${rs(w.t)} · now ${rs(m.eff)}
                                on ${m.pl.k}
                            </div>
                        </div>

                        <div class="row" style="gap:8px">
                            <span class="badge ${hit ? 'Good' : 'Normal'}">
                                ${hit
                                    ? 'Target reached'
                                    : rs(m.eff - w.t) + ' above'}
                            </span>

                            <button
                                class="btn alt"
                                data-view="${w.id}">
                                View
                            </button>

                            <button
                                class="btn alt"
                                data-unw="${w.id}">
                                Stop
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// =======================================
// Render
// =======================================

function render() {
    if (!PROD.length) {
        if ($('#main')) {
            $('#main').innerHTML = `
                <div class="card empty">
                    No products are currently available.
                </div>
            `;
        }

        return;
    }

    $('#main').innerHTML = {
        cmp: viewCmp,
        bsk: viewBsk,
        wl: viewWl
    }[S.tab]();

    const basketCount = Object.keys(S.basket).length;

    $('#bc').textContent = basketCount
        ? `(${basketCount})`
        : '';

    $('#wc').textContent = S.watch.length
        ? `(${S.watch.length})`
        : '';

    document.querySelectorAll('nav button').forEach(button => {
        button.setAttribute(
            'aria-selected',
            button.dataset.t === S.tab
        );
    });
}

function open(id) {
    if (!PROD[id]) return;

    S.pid = id;
    S.sel = 0;
    S.tab = 'cmp';

    $('#q').value = PROD[id].name;

    render();
}

// =======================================
// Initialization
// =======================================

function setupLocation() {
    $('#city').innerHTML = Object.keys(CITY)
        .map(city => `<option>${city}</option>`)
        .join('');

    $('#city').value = S.city;
    $('#pin').value = S.pin;
}

function setupSearchSuggestions() {
    $('#plist').innerHTML = PROD
        .map(p => `<option value="${p.name}">`)
        .join('');

    const popularProducts = [
        'Tata Salt',
        'Amul Taaza Milk',
        'Aashirvaad Atta',
        'Maggi 2-Minute Noodles',
        'Eggs'
    ];

    $('#chips').innerHTML = popularProducts
        .map(name => `
            <button
                class="chip"
                type="button"
                data-go="${name}">
                ${name}
            </button>
        `)
        .join('');
}

// =======================================
// Events
// =======================================

function setupEvents() {
    $('#sf').onsubmit = event => {
        event.preventDefault();

        const product = findP($('#q').value);

        if (product) {
            open(product.id);
        } else {
            const query = $('#q').value.replace(/[<>&]/g, '');

            $('#main').innerHTML = `
                <div class="card empty">
                    No product matches “${query}”.
                    Try one of the suggestions above.
                </div>
            `;
        }
    };

    $('#city').onchange = event => {
        S.city = event.target.value;

        save();
        render();
    };

    $('#pin').oninput = event => {
        S.pin = event.target.value.replace(/\D/g, '');

        event.target.value = S.pin;

        save();
        render();
    };

    document.addEventListener('click', event => {
        const target = event.target.closest(
            '[data-t],[data-go],[data-sel],[data-a],[data-q],[data-rm],[data-unw],[data-view]'
        );

        if (!target) return;

        const d = target.dataset;

        if (d.t) {
            S.tab = d.t;
            render();

        } else if (d.go) {
            const product = findP(d.go);

            if (product) {
                open(product.id);
            }

        } else if (d.sel !== undefined) {
            S.sel = Number(d.sel);
            render();

        } else if (d.a === 'add') {
            S.basket[S.pid] = (S.basket[S.pid] || 0) + 1;

            save();

            S.tab = 'bsk';
            render();

        } else if (d.a === 'watch') {
            const value = parseFloat($('#tg').value);

            if (value > 0) {
                const existing = S.watch.find(
                    item => item.id === S.pid
                );

                if (existing) {
                    existing.t = value;
                } else {
                    S.watch.push({
                        id: S.pid,
                        t: value
                    });
                }

                save();

                S.tab = 'wl';
                render();

            } else {
                $('#tg').focus();
            }

        } else if (d.q !== undefined) {
            const id = Number(d.q);
            const current = S.basket[id] || 1;

            S.basket[id] = Math.max(
                1,
                current + Number(d.n)
            );

            save();
            render();

        } else if (d.rm !== undefined) {
            delete S.basket[Number(d.rm)];

            save();
            render();

        } else if (d.unw !== undefined) {
            S.watch = S.watch.filter(
                item => item.id !== Number(d.unw)
            );

            save();
            render();

        } else if (d.view !== undefined) {
            open(Number(d.view));
        }
    });

    document.addEventListener('keydown', event => {
        if (
            event.key === 'Enter' &&
            event.target.dataset &&
            event.target.dataset.sel !== undefined
        ) {
            S.sel = Number(event.target.dataset.sel);
            render();
        }
    });
}

// =======================================
// Start application
// =======================================

async function init() {
    setupLocation();
    setupEvents();

    await loadProducts();

    if (!PROD.length) return;

    setupSearchSuggestions();

    $('#q').value = PROD[0].name;

    render();
}

init();
<div align="center">
  <img src="https://img.shields.io/badge/VIT%20Bhopal-VITB%20Caf%C3%A9s-C8860A?style=for-the-badge&labelColor=1C1008" alt="VITB Cafés"/>

# 🍽️ VITB Cafés

### Discover, rate & review dishes across all 5 campus cafés

**By VITians · For VITians**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-C8860A?style=flat-square&logo=vercel&logoColor=white)](https://vitb-cafes.vercel.app)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com)

</div>

---

## 📸 Preview

> A full-stack campus food-discovery platform for VIT Bhopal students. Browse complete café menus, discover highly rated dishes, share ratings and reviews, and make better food choices with help from the campus community.

---

## ✨ Features

- 🏪 **5 Campus Cafés** — Mayuri, Underbelly, Mayuri Spl Block, AB's Dakshin and Bistro
- 🍛 **500+ Dishes** — complete menus with prices and categories
- ⭐ **Live Ratings** — real-time star ratings stored in MongoDB and visible to everyone
- 💬 **Peer Reviews** — read what fellow VITians say before ordering
- 🔍 **Cross-Café Search** — instantly search dishes across every café
- 📊 **Smart Sorting** — dishes are ordered by their highest ratings first
- 📈 **Platform Statistics** — live rating totals and community activity
- 📬 **Feedback System** — feedback is stored in MongoDB and delivered instantly through Gmail
- 🎨 **Modern UI/UX** — polished interface, smooth animations and improved navigation
- 🍽️ **Detailed Dish Experience** — clear dish cards with prices, ratings and reviews
- 🔄 **Real-Time Updates** — ratings refresh without requiring a page reload
- ☰ **Quick Navigation** — responsive hamburger menu with About and Feedback shortcuts
- ⚡ **Fast Performance** — lightweight vanilla frontend with efficient API requests
- 📱 **Fully Responsive** — optimized for mobile, tablet and desktop

---


## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas with Mongoose ODM |
| Email Service | Nodemailer with Gmail SMTP |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## 📁 Project Structure

```text
vitb-cafes/
├── index.html
├── style.css
├── logo.png
├── README.md
├── .gitignore
│
└── api/
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── db/
    │   └── connect.js
    ├── models/
    │   ├── Rating.js
    │   └── Feedback.js
    ├── routes/
    │   ├── ratings.js
    │   ├── feedback.js
    │   └── stats.js
    ├── scripts/
    │   └── migrate-rating-keys.js
    └── utils/
        └── text.js
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api` | Health check |
| `GET` | `/api/ratings` | Fetch all ratings aggregated from MongoDB |
| `GET` | `/api/ratings/:cafeId/:itemKey` | Get ratings for a specific dish |
| `POST` | `/api/ratings` | Submit a new rating and review |
| `POST` | `/api/feedback` | Submit user feedback |
| `GET` | `/api/stats` | Fetch platform statistics |

### Example — Submit a Rating

```http
POST /api/ratings
Content-Type: application/json

{
  "cafeId": "mayuri",
  "itemName": "Masala Dosa",
  "rating": 5,
  "name": "Prajjwal",
  "review": "Crispy and absolutely delicious!"
}
```

---

## 🍕 Cafés Included

| Café | Location | Specialty |
|------|----------|-----------|
| 🍽️ Mayuri | Academic Block 1 | Authentic Indian, Momos, South Indian |
| 🍕 Underbelly | Academic Block 1 | Non-veg, Pasta, Cakes, Chinese |
| 🍰 Mayuri Spl Block | Special Block | Beverages, International, Tandoor |
| 🥗 AB's Dakshin | Special Block | South Indian, Biryani, Fresh Juices |
| ☕ Bistro | Special Block | Artisan Coffee, Wraps, Pizzas |

---

## 🤝 Contributing

Contributions are welcome! You can help by:

- 🍽️ Updating café menus
- ⭐ Improving ratings and review features
- 🐞 Reporting bugs
- 💡 Suggesting new features
- 🔧 Opening a pull request

---

<div align="center">

Made with ❤️ for VITians · VIT Bhopal University · 2026

</div>

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

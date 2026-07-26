card.innerHTML = `
  <img
    src="${item.img}"
    class="menu-img"
    alt="${item.name}"
    loading="lazy"
  >

  <div class="menu-content">
    <h2 class="menu-item-title">${item.name}</h2>

    <p class="menu-description">
      ${item.description}
    </p>

    <div class="menu-action">
      <p class="menu-price">$${item.price.toFixed(2)}</p>

      <button
        class="menu-btn"
        type="button"
        aria-label="Add ${item.name} to cart">
        Add to Cart
      </button>
    </div>
  </div>
`;
document.addEventListener("DOMContentLoaded", function initialiseSalesAnalytics() {
  if (!HC.initPage("analytics", ["vendor"])) return;
  const user = HC.getCurrentUser();
  const stallId = user.stallId || "clementi-chicken-rice";

  // function getOrders() {
  //   const visible = HC.getVisibleOrders();
  //   if (visible.length >= 4) return visible;
  //   return [
  //     ...visible,
  //     { id: "AN-1", createdAt: "2026-07-26T09:10:00+08:00", total: 26.4, items: [{ name: "Signature Chicken Rice", quantity: 4, stallId }] },
  //     { id: "AN-2", createdAt: "2026-07-27T12:15:00+08:00", total: 41.8, items: [{ name: "Signature Chicken Rice", quantity: 6, stallId }, { name: "Roasted Chicken Rice", quantity: 2, stallId }] },
  //     { id: "AN-3", createdAt: "2026-07-28T18:30:00+08:00", total: 34.1, items: [{ name: "Roasted Chicken Rice", quantity: 5, stallId }] },
  //     { id: "AN-4", createdAt: "2026-07-29T13:05:00+08:00", total: 52.7, items: [{ name: "Signature Chicken Rice", quantity: 8, stallId }] },
  //     { id: "AN-5", createdAt: "2026-07-30T19:15:00+08:00", total: 38.6, items: [{ name: "Chicken Dumpling Soup", quantity: 4, stallId }] }
  //   ];
  // }

  function drawBarChart(canvas, labels, values, valuePrefix) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 48;
    context.clearRect(0, 0, width, height);
    const max = Math.max(...values, 1);
    const barSpace = (width - padding * 2) / values.length;
    const barWidth = Math.max(22, barSpace * 0.58);
    context.font = "14px system-ui";
    context.textAlign = "center";
    values.forEach((value, index) => {
      const barHeight = (value / max) * (height - padding * 2);
      const x = padding + index * barSpace + (barSpace - barWidth) / 2;
      const y = height - padding - barHeight;
      context.fillStyle = "#850606";
      context.fillRect(x, y, barWidth, barHeight);
      context.fillStyle = "#1f2937";
      context.fillText(`${valuePrefix}${value.toFixed(valuePrefix ? 0 : 0)}`, x + barWidth / 2, y - 9);
      context.fillStyle = "#667085";
      context.fillText(labels[index], x + barWidth / 2, height - 18);
    });
  }

  async function render() {
    const period = document.getElementById("analyticsPeriod").value;
    const response = await fetch(
    `http://localhost:3000/api/sales?stallId=${stallId}`,
    {
        headers: {
            "Authorization": `Bearer ${HC.getAuthToken()}`
        }
    }
  );
    const data = await response.json();
    const summary = data.summary;
    const popularItems = data.popularItems;
    const salesTrend = data.salesTrend;
    document.getElementById("analyticsStats").innerHTML = [
      ["Total sales", HC.formatCurrency(summary.TotalRevenue)],
      ["Number of orders", summary.TotalOrders],
      ["Average order value", HC.formatCurrency(summary.AverageOrderValue)]
    ].map(([label, value]) => `<article class="stat"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></article>`).join("");

    // const itemCounts = {};
    // const hourCounts = { "8 AM": 0, "10 AM": 0, "12 PM": 0, "2 PM": 0, "6 PM": 0, "8 PM": 0 };
    // orders.forEach((order) => {
    //   order.items.filter((item) => item.stallId === stallId).forEach((item) => {
    //     itemCounts[item.name] = (itemCounts[item.name] || 0) + Number(item.quantity);
    //   });
    //   const hour = new Date(order.createdAt).getHours();
    //   const bucket = hour < 10 ? "8 AM" : hour < 12 ? "10 AM" : hour < 14 ? "12 PM" : hour < 18 ? "2 PM" : hour < 20 ? "6 PM" : "8 PM";
    //   hourCounts[bucket] += 1;
    // });
    // const popular = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
    // const maxCount = Math.max(...popular.map((entry) => entry[1]), 1);

    const maxCount = Math.max(...popularItems.map(item => item.QuantitySold), 1);
    document.getElementById("analyticsPopularItems").innerHTML = popularItems.map(item => `<div class="popular-bar"><strong>${HC.escapeHtml(item.ItemDesc)}</strong><div class="progress"><span style="width:${(item.QuantitySold / maxCount) * 100}%"></span></div><span>${item.QuantitySold} sold</span></div>`).join("");

    // const trendLabels = period === "monthly" ? ["Mar", "Apr", "May", "Jun", "Jul", "Aug"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // const trendValues = period === "monthly" ? [680, 755, 720, 850, Math.round(totalSales + 700), 910] : [48, 63, 57, 81, 94, Math.round(totalSales / 4)];
    const trendLabels = salesTrend.map(s =>new Date(s.SaleDate).toLocaleDateString());
    const trendValues = salesTrend.map(s => s.Revenue);
    drawBarChart(document.getElementById("salesChart"), trendLabels, trendValues, "$");
    // drawBarChart(document.getElementById("hoursChart"), Object.keys(hourCounts), Object.values(hourCounts), "");
  }

  document.getElementById("analyticsPeriod").addEventListener("change", render);
  window.addEventListener("resize", render);
  render();
});

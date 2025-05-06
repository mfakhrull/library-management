// This is a simple data URL for a placeholder book cover image
const placeholderImageBase64 = `
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnPgogIDxyZWN0IHN0cm9rZT0iIzAwMCIgaWQ9InN2Z18xIiBoZWlnaHQ9Ijc1MCIgd2lkdGg9IjUwMCIgeT0iMCIgeD0iMCIgb3BhY2l0eT0iMC4xIiBzdHJva2Utd2lkdGg9IjAiIGZpbGw9IiNkMWQxZDEiLz4KICA8dGV4dCBmaWxsPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjI1MCIgeT0iMzc1IiBpZD0ic3ZnXzIiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJzZXJpZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gQ292ZXIgSW1hZ2U8L3RleHQ+CiA8L2c+Cjwvc3ZnPg==
`;

// Create a blob from the base64 data
const blob = await fetch(placeholderImageBase64).then(res => res.blob());

// Create a File object
const file = new File([blob], 'placeholder-book.jpg', { type: 'image/jpeg' });

// Write it to the public folder
await fs.promises.writeFile('public/placeholder-book.jpg', await file.arrayBuffer());
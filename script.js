tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                gold: {
                    50: '#fbf7ee',
                    100: '#f5ead2',
                    400: '#dfb76c',
                    500: '#d4af37', // Gold Leaf accent
                    600: '#b8942a',
                    700: '#91711e',
                },
                zinc: {
                    400: '#94a3b8', // slate-400 equivalent for text
                    500: '#64748b',
                    600: '#224682',
                    700: '#153366',
                    800: '#0c224a',
                    900: '#06132d',
                    950: '#030b1c',
                },
                dark: {
                    950: '#030b1c', // Deep Navy
                    900: '#06132d', // Navy
                    800: '#0c224a',
                    700: '#153366',
                    600: '#224682'
                }
            }
        }
    }
}


// GLOBAL APP STATE ENGINE
class AppState {
    constructor() {
        this.currentSection = 'explore';
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'featured';
        this.currentUser = {
            name: localStorage.getItem('aura_username') || 'Sovereign Curator',
            avatarSeed: localStorage.getItem('aura_avatar') || 'AuraPhotographer'
        };

        // Initialize custom dynamic photography state from localStorage
        const localStore = localStorage.getItem('aura_custom_photos');
        this.customPhotos = localStore ? JSON.parse(localStore) : [];
    }

    init() {
        if (this.customPhotos.length > 0) {
            this.renderGallery();
        }
        this.updateProfileUI();

        // Keep Header sticky and background translucent on scroll
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 40) {
                navbar.classList.add('glass-panel', 'shadow-2xl');
                navbar.classList.remove('bg-transparent');
            } else {
                navbar.classList.remove('glass-panel', 'shadow-2xl');
                navbar.classList.add('bg-transparent');
            }
        });

        // Set initial random hero presentation from DB
        const featured = this.getCombinedDatabase().filter(p => p.featured);
        if (featured.length > 0) {
            const randomPick = featured[Math.floor(Math.random() * featured.length)];
            this.updateHeroBillboard(randomPick);
        }
    }

    getCombinedDatabase() {
        return [...this.customPhotos, ...MASTER_PHOTOGRAPHY_STORE];
    }

    updateProfileUI() {
        document.getElementById('profile-name-label').innerText = this.currentUser.name;
        document.getElementById('profile-settings-name').value = this.currentUser.name;

        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${this.currentUser.avatarSeed}`;
        document.getElementById('nav-avatar').src = avatarUrl;
        document.getElementById('profile-settings-avatar').src = avatarUrl;
    }

    updateHeroBillboard(photo) {
        document.getElementById('hero-image-bg').src = photo.imageUrl;
        document.getElementById('hero-title').innerText = photo.title;
        document.getElementById('hero-photographer').innerHTML = `
            Captured by <span class="text-gold-400 not-italic font-semibold">${photo.photographer}</span> — ${photo.camera} Blueprint
        `;
        document.getElementById('hero-action-btn').onclick = () => artDetailViewer.openModal(photo.id);
    }

    changeSection(sectionId) {
        this.currentSection = sectionId;

        // Update navigation buttons
        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.classList.remove('text-gold-500', 'font-semibold');
            btn.classList.add('text-zinc-400');
        });

        const activeBtn = document.getElementById(`nav-${sectionId}`);
        if (activeBtn) {
            activeBtn.classList.remove('text-zinc-400');
            activeBtn.classList.add('text-gold-500', 'font-semibold');
        }

        // Hide/Show main body views
        document.querySelectorAll('.section-container').forEach(sec => sec.classList.add('hidden'));
        document.getElementById(`section-${sectionId}`).classList.remove('hidden');

        // Smooth scroll back to top of display window
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.closeUserDropdown();
    }

    scrollToStore() {
        document.getElementById('catalogue-anchor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    toggleUserDropdown() {
        const drop = document.getElementById('user-dropdown');
        drop.classList.toggle('hidden');
    }

    closeUserDropdown() {
        document.getElementById('user-dropdown').classList.add('hidden');
    }

    openProfileSettings() {
        document.getElementById('profile-settings-modal').classList.remove('hidden');
        this.closeUserDropdown();
    }

    closeProfileSettings() {
        document.getElementById('profile-settings-modal').classList.add('hidden');
    }

    randomizeAvatar() {
        const prefixes = ["Horizon", "Lens", "Focal", "Zenith", "Aura", "Capture", "Shutter"];
        const randVal = prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(Math.random() * 999);
        this.currentUser.avatarSeed = randVal;

        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randVal}`;
        document.getElementById('profile-settings-avatar').src = avatarUrl;
    }

    saveProfileSettings() {
        const val = document.getElementById('profile-settings-name').value.trim();
        if (val) {
            this.currentUser.name = val;
            localStorage.setItem('aura_username', val);
            localStorage.setItem('aura_avatar', this.currentUser.avatarSeed);
            this.updateProfileUI();
            this.closeProfileSettings();
            createNotification('Profile customizations applied successfully!', 'success');
        }
    }

    setCategoryFilter(category) {
        this.selectedCategory = category;

        // Manage active button visual styles
        document.querySelectorAll('.category-btn').forEach(btn => {
            if (btn.getAttribute('data-cat') === category) {
                btn.classList.add('bg-gold-500', 'text-dark-950', 'border-gold-500');
                btn.classList.remove('border-zinc-800', 'text-zinc-400');
            } else {
                btn.classList.remove('bg-gold-500', 'text-dark-950', 'border-gold-500');
                btn.classList.add('border-zinc-800', 'text-zinc-400');
            }
        });

        this.renderGallery();
    }

    handleGlobalSearch(val) {
        this.searchQuery = val.trim().toLowerCase();
        const container = document.getElementById('search-feedback');

        if (this.searchQuery.length > 0) {
            container.classList.remove('hidden');
            document.getElementById('search-keyword').innerText = val;
        } else {
            container.classList.add('hidden');
        }

        this.renderGallery();
    }

    handleSort(sortMethod) {
        this.sortBy = sortMethod;
        this.renderGallery();
    }

    resetFilters() {
        document.getElementById('navbar-search').value = '';
        this.searchQuery = '';
        document.getElementById('search-feedback').classList.add('hidden');
        this.setCategoryFilter('all');
    }

    resetAppState() {
        localStorage.clear();
        this.customPhotos = [];
        this.currentUser = { name: 'Sovereign Curator', avatarSeed: 'AuraPhotographer' };
        this.updateProfileUI();
        this.renderGallery();
        createNotification('Simulator memory cache wiped and restored.', 'info');
        this.closeUserDropdown();
    }

    renderGallery() {
        const grid = document.getElementById('art-grid');
        grid.innerHTML = '';

        // Build filtered dynamic collection list
        let combinedDb = this.getCombinedDatabase();

        // 1. Apply category filtering
        if (this.selectedCategory !== 'all') {
            combinedDb = combinedDb.filter(photo => photo.category === this.selectedCategory);
        }

        // 2. Apply search queries
        if (this.searchQuery.length > 0) {
            combinedDb = combinedDb.filter(photo =>
                photo.title.toLowerCase().includes(this.searchQuery) ||
                photo.photographer.toLowerCase().includes(this.searchQuery) ||
                photo.category.toLowerCase().includes(this.searchQuery) ||
                photo.camera.toLowerCase().includes(this.searchQuery)
            );
        }

        // 3. Apply sorting configurations
        if (this.sortBy === 'price-low') {
            combinedDb.sort((a, b) => a.basePrice - b.basePrice);
        } else if (this.sortBy === 'price-high') {
            combinedDb.sort((a, b) => b.basePrice - a.basePrice);
        } else if (this.sortBy === 'popular') {
            combinedDb.sort((a, b) => b.likes - a.likes);
        } // default is Curated/Featured Order

        document.getElementById('gallery-count').innerText = combinedDb.length;

        if (combinedDb.length === 0) {
            document.getElementById('art-empty-state').classList.remove('hidden');
            return;
        } else {
            document.getElementById('art-empty-state').classList.add('hidden');
        }

        // Map into responsive HTML components
        combinedDb.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'group flex flex-col bg-dark-900 border border-zinc-800/80 rounded-2xl overflow-hidden cursor-pointer hover:border-gold-500/30 hover:-translate-y-1 transition-all duration-300';
            card.onclick = () => artDetailViewer.openModal(photo.id);

            card.innerHTML = `
                <!-- Photo Frame Aspect Container -->
                <div class="relative w-full aspect-[4/3] overflow-hidden bg-zinc-950">
                    <!-- Watermarked view with safe-fallback loader -->
                    <img src="${photo.imageUrl}" alt="${photo.title}" 
                         class="w-full h-full object-cover img-zoom" 
                         onerror="this.src='https://placehold.co/800x600/18181b/d4af37?text=AuraPrint+Studio'">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-dark-950/85 via-transparent to-transparent"></div>
                    
                    <!-- Rating/Hot Badge overlay -->
                    <div class="absolute top-3 left-3 bg-dark-950/80 backdrop-blur-md text-zinc-300 text-[9px] font-bold tracking-widest px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-zinc-800/60">
                        <i class="fa-solid fa-star text-gold-500"></i> ${photo.rating}
                    </div>

                    <!-- Interactive quick buy trigger -->
                    <button onclick="event.stopPropagation(); artDetailViewer.openModal('${photo.id}')" class="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-gold-500 hover:bg-gold-400 text-dark-950 flex items-center justify-center transition-all duration-300 shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                        <i class="fa-solid fa-expand text-xs"></i>
                    </button>
                </div>

                <!-- Card Metadata details -->
                <div class="p-5 flex-grow flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between text-[10px] tracking-wider uppercase font-medium text-zinc-500">
                            <span>${photo.category} Fine Art</span>
                            <span class="font-mono text-zinc-400">${photo.camera.split(' ')[0]} Frame</span>
                        </div>
                        <h4 class="font-serif font-bold text-lg text-white mt-1.5 group-hover:text-gold-400 transition-colors duration-300 line-clamp-1">${photo.title}</h4>
                        <p class="text-[11px] text-zinc-400 mt-1 italic">By <span class="not-italic text-zinc-300 font-semibold">${photo.photographer}</span></p>
                    </div>
                    
                    <!-- Base acquire configurations -->
                    <div class="flex items-center justify-between mt-5 pt-3.5 border-t border-zinc-800/40">
                        <span class="text-xs text-zinc-500">Prints from</span>
                        <span class="text-sm font-semibold text-gold-400 font-serif">$${photo.basePrice}.00</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

// DETAILED PREVIEW & INTERACTIVE WALL VISUALIZER ENGINE
class ArtDetailViewer {
    constructor() {
        this.currentPhoto = null;
        this.productMode = 'print'; // print or digital

        // Config selections
        this.selectedMaterial = 'paper'; // paper, canvas, metal
        this.selectedSize = 's'; // s, m, l
        this.selectedLicense = 'web'; // web, commercial, extended
        this.currentRoom = 'studio'; // studio, living, office
        this.currentFrameStyle = 'none'; // none, wood, gold
    }

    openModal(photoId) {
        const combined = appState.getCombinedDatabase();
        this.currentPhoto = combined.find(p => p.id === photoId);
        if (!this.currentPhoto) return;

        // Configure standard tags
        document.getElementById('modal-title').innerText = this.currentPhoto.title;
        document.getElementById('modal-category').innerText = `${this.currentPhoto.category} Collection`;
        document.getElementById('modal-photographer').innerText = `Fine Art Piece by ${this.currentPhoto.photographer}`;
        document.getElementById('modal-meta-camera').innerText = this.currentPhoto.camera;
        document.getElementById('modal-meta-lens').innerText = this.currentPhoto.lens;

        const imgEl = document.getElementById('modal-image');
        imgEl.src = this.currentPhoto.imageUrl;
        imgEl.onerror = () => imgEl.src = 'https://placehold.co/800x600/18181b/d4af37?text=Art+Missing';

        // Initial UI configurations
        this.setMaterial('paper');
        this.setSize('s');
        this.setRoomMockup('studio');
        this.setFrameStyle('none');
        this.switchProductMode('print');

        document.getElementById('art-detail-modal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }

    closeModal() {
        document.getElementById('art-detail-modal').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }

    switchProductMode(mode) {
        this.productMode = mode;

        const printTab = document.getElementById('tab-mode-print');
        const digitalTab = document.getElementById('tab-mode-digital');

        if (mode === 'print') {
            printTab.classList.add('border-gold-500', 'text-white');
            printTab.classList.remove('border-transparent', 'text-zinc-400');
            digitalTab.classList.add('border-transparent', 'text-zinc-400');
            digitalTab.classList.remove('border-gold-500', 'text-white');

            document.getElementById('product-panel-print').classList.remove('hidden');
            document.getElementById('product-panel-digital').classList.add('hidden');
        } else {
            digitalTab.classList.add('border-gold-500', 'text-white');
            digitalTab.classList.remove('border-transparent', 'text-zinc-400');
            printTab.classList.add('border-transparent', 'text-zinc-400');
            printTab.classList.remove('border-gold-500', 'text-white');

            document.getElementById('product-panel-digital').classList.remove('hidden');
            document.getElementById('product-panel-print').classList.add('hidden');
        }

        this.calculatePricing();
    }

    setMaterial(material) {
        this.selectedMaterial = material;
        document.querySelectorAll('.material-btn').forEach(btn => {
            if (btn.getAttribute('data-material') === material) {
                btn.className = "material-btn p-3 rounded-xl border border-gold-500/30 bg-gold-500/5 text-center transition-all text-xs";
            } else {
                btn.className = "material-btn p-3 rounded-xl border border-zinc-800 text-center hover:border-zinc-700 transition-all text-xs";
            }
        });
        this.calculatePricing();
    }

    setSize(size) {
        this.selectedSize = size;
        document.querySelectorAll('.size-btn').forEach(btn => {
            if (btn.getAttribute('data-size') === size) {
                btn.className = "size-btn p-3 rounded-xl border border-gold-500/30 bg-gold-500/5 text-center transition-all text-xs";
            } else {
                btn.className = "size-btn p-3 rounded-xl border border-zinc-800 text-center hover:border-zinc-700 transition-all text-xs";
            }
        });

        // Adjust frame mockup sizes according to configuration selection
        const frame = document.getElementById('mockup-frame');
        if (size === 's') {
            frame.style.transform = 'scale(0.55)';
        } else if (size === 'm') {
            frame.style.transform = 'scale(0.75)';
        } else {
            frame.style.transform = 'scale(1)';
        }

        this.calculatePricing();
    }

    setDigitalLicense(license) {
        this.selectedLicense = license;
        this.calculatePricing();
    }

    setRoomMockup(room) {
        this.currentRoom = room;
        const container = document.getElementById('visualizer-canvas-container');
        const watermark = document.getElementById('watermark-overlay');

        document.querySelectorAll('.mockup-btn').forEach(btn => {
            if (btn.getAttribute('data-room') === room) {
                btn.classList.add('bg-gold-500', 'text-dark-950');
                btn.classList.remove('bg-zinc-800', 'text-zinc-400', 'hover:text-white');
            } else {
                btn.classList.remove('bg-gold-500', 'text-dark-950');
                btn.classList.add('bg-zinc-800', 'text-zinc-400', 'hover:text-white');
            }
        });

        // Load custom room visualization backgrounds
        if (room === 'studio') {
            container.style.backgroundImage = 'none';
            container.style.backgroundColor = '#0c0c0e';
            watermark.classList.remove('hidden');
        } else if (room === 'living') {
            // Living room backdrop
            container.style.backgroundImage = 'url("https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200")';
            container.style.backgroundColor = 'transparent';
            watermark.classList.add('hidden');
        } else if (room === 'office') {
            // Corporate/lobby backdrop
            container.style.backgroundImage = 'url("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200")';
            container.style.backgroundColor = 'transparent';
            watermark.classList.add('hidden');
        }
    }

    setFrameStyle(frameStyle) {
        this.currentFrameStyle = frameStyle;
        const frame = document.getElementById('mockup-frame');

        document.querySelectorAll('.frame-btn').forEach(btn => {
            if (btn.getAttribute('data-frame') === frameStyle) {
                btn.classList.add('bg-gold-500', 'text-dark-950');
                btn.classList.remove('bg-zinc-800', 'text-zinc-400', 'hover:text-white');
            } else {
                btn.classList.remove('bg-gold-500', 'text-dark-950');
                btn.classList.add('bg-zinc-800', 'text-zinc-400', 'hover:text-white');
            }
        });

        // Apply active framing CSS border styling
        if (frameStyle === 'none') {
            frame.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            frame.style.padding = '0px';
            frame.style.backgroundColor = 'transparent';
        } else if (frameStyle === 'wood') {
            frame.style.border = '20px solid #1c1917'; // Rich dark timber border
            frame.style.padding = '12px';
            frame.style.backgroundColor = '#fff'; // White mounting mat
        } else if (frameStyle === 'gold') {
            frame.style.border = '20px solid #c5a059'; // Shiny gold leaf
            frame.style.padding = '12px';
            frame.style.backgroundColor = '#fff'; // White mounting mat
        }

        this.calculatePricing();
    }

    calculatePricing() {
        if (!this.currentPhoto) return 0;

        let total = this.currentPhoto.basePrice;

        if (this.productMode === 'print') {
            // Material premiums
            if (this.selectedMaterial === 'canvas') total += 35;
            if (this.selectedMaterial === 'metal') total += 65;

            // Size multipliers
            if (this.selectedSize === 'm') total += 50;
            if (this.selectedSize === 'l') total += 110;

            // Frame premiums
            if (this.currentFrameStyle === 'wood') total += 45;
            if (this.currentFrameStyle === 'gold') total += 85;
        } else {
            // Digital Licenses
            if (this.selectedLicense === 'web') total = total * 0.8; // Web discounted
            if (this.selectedLicense === 'commercial') total += 150;
            if (this.selectedLicense === 'extended') total += 450;
        }

        document.getElementById('calculated-price').innerText = total.toFixed(2);
        return total;
    }

    triggerAddToCart() {
        const total = this.calculatePricing();
        let itemMeta = "";

        if (this.productMode === 'print') {
            itemMeta = `${this.selectedSize.toUpperCase()} size / ${this.selectedMaterial} / Frame: ${this.currentFrameStyle}`;
        } else {
            itemMeta = `Digital Royalty: ${this.selectedLicense.toUpperCase()}`;
        }

        const item = {
            photoId: this.currentPhoto.id,
            title: this.currentPhoto.title,
            photographer: this.currentPhoto.photographer,
            imageUrl: this.currentPhoto.imageUrl,
            price: total,
            meta: itemMeta,
            mode: this.productMode
        };

        cartManager.addItem(item);
        this.closeModal();
    }
}

// CART DRAWER STATE MANAGER
class CartManager {
    constructor() {
        this.items = [];
    }

    toggleCartDrawer() {
        const draw = document.getElementById('cart-drawer-overlay');
        draw.classList.toggle('hidden');
        this.renderCart();
    }

    addItem(item) {
        this.items.push(item);
        this.updateCounters();
        createNotification(`Added "${item.title}" to collection bag!`, 'success');
        this.toggleCartDrawer();
    }

    removeItem(index) {
        const photoTitle = this.items[index].title;
        this.items.splice(index, 1);
        this.updateCounters();
        this.renderCart();
        createNotification(`Removed "${photoTitle}" from bag`, 'info');
    }

    updateCounters() {
        document.getElementById('cart-counter').innerText = this.items.length;
    }

    renderCart() {
        const container = document.getElementById('cart-stack');
        const emptyPlc = document.getElementById('cart-empty-placeholder');
        container.innerHTML = '';

        if (this.items.length === 0) {
            emptyPlc.classList.remove('hidden');
            this.updateBillTotals(0);
            return;
        } else {
            emptyPlc.classList.add('hidden');
        }

        this.items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-3 rounded-xl relative';
            row.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.title}" class="w-14 h-14 rounded-lg object-cover bg-zinc-950">
                <div class="flex-grow">
                    <h5 class="text-xs font-bold text-white line-clamp-1">${item.title}</h5>
                    <p class="text-[9px] text-zinc-500 mt-0.5">${item.meta}</p>
                    <p class="text-xs font-semibold text-gold-500 font-serif mt-1">$${item.price.toFixed(2)}</p>
                </div>
                <button onclick="cartManager.removeItem(${index})" class="text-zinc-600 hover:text-rose-400 p-1.5 transition-colors">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            `;
            container.appendChild(row);
        });

        const subtotal = this.items.reduce((acc, curr) => acc + curr.price, 0);
        this.updateBillTotals(subtotal);
    }

    updateBillTotals(subtotal) {
        const tax = subtotal * 0.08; // 8% simulated tax
        const total = subtotal + tax;

        document.getElementById('cart-subtotal').innerText = subtotal.toFixed(2);
        document.getElementById('cart-tax').innerText = tax.toFixed(2);
        document.getElementById('cart-grandtotal').innerText = total.toFixed(2);
        document.getElementById('checkout-total-bill').innerText = `$${total.toFixed(2)}`;
    }

    openCheckoutModal() {
        if (this.items.length === 0) {
            createNotification('Your bag is empty. Please configure photography first.', 'info');
            return;
        }
        document.getElementById('checkout-modal').classList.remove('hidden');
        this.toggleCartDrawer();
    }

    closeCheckoutModal() {
        document.getElementById('checkout-modal').classList.add('hidden');
    }

    triggerFinalAcquisition() {
        const userMail = document.getElementById('checkout-email').value;
        this.closeCheckoutModal();

        // Clear cart state
        this.items = [];
        this.updateCounters();

        // Open visual certificate simulated success alert
        createNotification('Purchase successful! High-res metadata and invoice dispatched.', 'success');

        // Display gorgeous success message box
        setTimeout(() => {
            alert(`Congratulations collector! Your fine art transaction is complete.\n\nSimulated print license & high-res assets dispatched to: ${userMail}`);
        }, 400);
    }
}

// CREATOR PORTAL MANAGEMENT SYSTEM
class CreatorPortal {
    constructor() {
        this.selectedBase64Data = null;
    }

    initUploadListener() {
        const filePicker = document.getElementById('upload-file-picker');
        const feedback = document.getElementById('upload-file-feedback');

        filePicker.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.selectedBase64Data = event.target.result;
                    feedback.classList.remove('hidden');
                    createNotification('Image uploaded successfully', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    submitCreation() {
        const title = document.getElementById('upload-title').value.trim();
        const category = document.getElementById('upload-category').value;
        const description = document.getElementById('upload-description').value.trim();
        const price = parseFloat(document.getElementById('upload-price').value) || 120;
        const camera = document.getElementById('upload-camera').value.trim() || 'Aura Capture Studio';
        const lens = document.getElementById('upload-lens').value.trim() || 'Focal Prime Optics';
        let imageUrl = document.getElementById('upload-image-url').value.trim();

        if (!title) {
            createNotification('Please declare a title for your photograph.', 'info');
            return;
        }

        // If user didn't pick file or image URL, assign a beautiful high-res default fallback
        if (!imageUrl && !this.selectedBase64Data) {
            imageUrl = "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=1200";
        } else if (this.selectedBase64Data) {
            imageUrl = this.selectedBase64Data;
        }

        const newPhoto = {
            id: "custom-" + Date.now(),
            title: title,
            description: description || "Exclusive creative backstory soon.",
            category: category,
            imageUrl: imageUrl,
            photographer: appState.currentUser.name,
            basePrice: price,
            camera: camera,
            lens: lens,
            views: "10",
            likes: 1,
            rating: 5.0,
            featured: true
        };

        // Append and save locally to state
        appState.customPhotos.unshift(newPhoto);
        localStorage.setItem('aura_custom_photos', JSON.stringify(appState.customPhotos));

        // Clear input form values
        document.getElementById('upload-title').value = '';
        document.getElementById('upload-description').value = '';
        document.getElementById('upload-image-url').value = '';
        document.getElementById('upload-file-picker').value = '';
        document.getElementById('upload-price').value = '120';
        document.getElementById('upload-camera').value = '';
        document.getElementById('upload-lens').value = '';
        document.getElementById('upload-file-feedback').classList.add('hidden');
        this.selectedBase64Data = null;

        // Sync UI and switch back to main list
        appState.renderGallery();
        appState.changeSection('explore');
        createNotification('Your photograph is now live in the global catalog!', 'success');
    }
}

// FLOATING NOTIFICATION SYSTEM (Alternative to native alert)
function createNotification(msg, type = 'info') {
    const stack = document.getElementById('alert-stack');
    const alertBox = document.createElement('div');

    let icon = '<i class="fa-solid fa-circle-info text-gold-500"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check text-emerald-400"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation text-rose-500"></i>';

    alertBox.className = 'glass-premium px-5 py-3.5 rounded-xl flex items-center space-x-3 text-xs font-semibold text-white shadow-xl border border-gold-500/10 transform translate-y-3 opacity-0 transition-all duration-300 pointer-events-auto';
    alertBox.innerHTML = `
        ${icon}
        <span class="tracking-wider">${msg}</span>
    `;

    stack.appendChild(alertBox);

    // Trigger animation slider
    setTimeout(() => {
        alertBox.classList.remove('translate-y-3', 'opacity-0');
    }, 10);

    // Auto dismiss notification
    setTimeout(() => {
        alertBox.classList.add('translate-y-[-10px]', 'opacity-0');
        setTimeout(() => alertBox.remove(), 300);
    }, 3000);
}

// INSTANTIATE AND BOOT APP
const appState = new AppState();
const artDetailViewer = new ArtDetailViewer();
const cartManager = new CartManager();
const creatorPortal = new CreatorPortal();

window.onload = function () {
    appState.init();
    creatorPortal.initUploadListener();
    createNotification('Welcome to AuraPrint Photography Studio', 'success');
};

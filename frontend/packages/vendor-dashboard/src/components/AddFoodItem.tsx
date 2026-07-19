import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  InputAdornment,
  Grid,
} from '@mui/material';
import { SYNTHETIC_STALLS, SYNTHETIC_FOOD_ITEMS, FoodItemSynthetic } from '../../../fan-interface/src/data/syntheticData';

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B32C1A" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
);

const CATEGORIES = ['Pizza', 'Burger', 'Hot Dog', 'Tacos', 'Nachos', 'Asian', 'Dessert', 'Drinks', 'Sandwich', 'Salad', 'Other'];
const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Nut-Free', 'Halal', 'Kosher'];
const SAMPLE_IMAGE_URLS: Record<string, string> = {
  Pizza: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
  Burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
  'Hot Dog': 'https://images.unsplash.com/photo-1619740455993-9d622bf5e27c?w=500&q=80',
  Tacos: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80',
  Nachos: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80',
  Asian: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&q=80',
  Dessert: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=80',
  Drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80',
  Sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80',
  Salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
  Other: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80',
};

interface AddFoodItemProps {
  onItemAdded?: (item: FoodItemSynthetic) => void;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'Pizza',
  stallId: SYNTHETIC_STALLS[0].id,
  preparationTime: '10',
  dietaryInfo: [] as string[],
  imageUrl: '',
  popular: false,
};

const AddFoodItem: React.FC<AddFoodItemProps> = ({ onItemAdded }) => {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<FoodItemSynthetic[]>(SYNTHETIC_FOOD_ITEMS);
  const [toast, setToast] = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({
    open: false, msg: '', type: 'success',
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'category') {
      setForm((prev) => ({ ...prev, category: e.target.value, imageUrl: SAMPLE_IMAGE_URLS[e.target.value] || '' }));
    }
  };

  const toggleDietary = (option: string) => {
    setForm((prev) => ({
      ...prev,
      dietaryInfo: prev.dietaryInfo.includes(option)
        ? prev.dietaryInfo.filter((d) => d !== option)
        : [...prev.dietaryInfo, option],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.description.trim()) {
      setToast({ open: true, msg: 'Please fill in all required fields', type: 'error' });
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setToast({ open: true, msg: 'Invalid price', type: 'error' });
      return;
    }

    const stall = SYNTHETIC_STALLS.find((s) => s.id === form.stallId);
    const newItem: FoodItemSynthetic = {
      id: `food-custom-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category: form.category,
      imageUrl: form.imageUrl || SAMPLE_IMAGE_URLS[form.category] || '',
      dietaryInfo: form.dietaryInfo,
      preparationTime: parseInt(form.preparationTime) || 10,
      stallId: form.stallId,
      stallName: stall?.name || 'Unknown Stall',
      rating: 4.5,
      popular: form.popular,
      tags: [form.category.toLowerCase()],
    };

    setItems((prev) => [newItem, ...prev]);
    onItemAdded?.(newItem);
    setForm({ ...emptyForm, imageUrl: '' });
    setToast({ open: true, msg: `"${newItem.name}" added successfully! Fans can now swipe on it.`, type: 'success' });
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const imagePreview = form.imageUrl || SAMPLE_IMAGE_URLS[form.category];

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: 'rgba(254,127,66,0.25)' },
      '&:hover fieldset': { borderColor: 'rgba(254,127,66,0.5)' },
      '&.Mui-focused fieldset': { borderColor: '#FE7F42' },
      background: 'rgba(255,255,255,0.04)',
    },
    '& .MuiInputBase-input': { color: '#FFFB97', fontFamily: '"Outfit", sans-serif' },
    '& .MuiInputLabel-root': { color: 'rgba(255,251,151,0.55)', fontFamily: '"Outfit", sans-serif' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FE7F42' },
    '& .MuiSelect-icon': { color: '#FE7F42' },
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 22, color: '#FFFB97' }}>
            Add Menu Item
          </Typography>
          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 13, color: '#FE7F42', mt: 0.3 }}>
            New items appear in fan swipe feed instantly
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          background: 'rgba(255,251,151,0.04)',
          border: '1.5px solid rgba(254,127,66,0.2)',
          borderRadius: '20px',
          p: { xs: 2, sm: 3 },
          mb: 4,
        }}
      >
        <Grid container spacing={2}>
          {/* Left: Image Preview */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                height: 200,
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(42,22,23,0.6)',
                backgroundImage: `url(${imagePreview})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1.5px solid rgba(254,127,66,0.2)',
                position: 'relative',
              }}
            >
              <Box sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(42,22,23,0.7) 0%, transparent 60%)',
              }} />
              <Box sx={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 14, color: '#FFFB97' }}>
                  {form.name || 'Item Name'}
                </Typography>
                <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 13, color: '#FE7F42', fontWeight: 600 }}>
                  {form.price ? `$${parseFloat(form.price).toFixed(2)}` : '$0.00'}
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: 'rgba(255,251,151,0.4)', mt: 1, textAlign: 'center' }}>
              Live preview as you type
            </Typography>
          </Grid>

          {/* Right: Fields */}
          <Grid item xs={12} sm={8}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Food Name *"
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
                size="small"
                sx={fieldSx}
              />
              <TextField
                label="Description *"
                value={form.description}
                onChange={handleChange('description')}
                fullWidth
                size="small"
                multiline
                rows={2}
                sx={fieldSx}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="Price *"
                  value={form.price}
                  onChange={handleChange('price')}
                  type="number"
                  size="small"
                  sx={{ ...fieldSx, flex: 1 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ color: '#FE7F42' }}>$</InputAdornment>,
                    inputProps: { min: 0.01, step: 0.01 },
                  }}
                />
                <TextField
                  label="Prep Time (min)"
                  value={form.preparationTime}
                  onChange={handleChange('preparationTime')}
                  type="number"
                  size="small"
                  sx={{ ...fieldSx, flex: 1 }}
                  inputProps={{ min: 1 }}
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  select
                  label="Category"
                  value={form.category}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, category: e.target.value, imageUrl: SAMPLE_IMAGE_URLS[e.target.value] || '' }));
                  }}
                  size="small"
                  sx={{ ...fieldSx, flex: 1 }}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat} sx={{ fontFamily: '"Outfit", sans-serif', color: '#2A1617' }}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Stall"
                  value={form.stallId}
                  onChange={(e) => setForm((prev) => ({ ...prev, stallId: e.target.value }))}
                  size="small"
                  sx={{ ...fieldSx, flex: 1 }}
                >
                  {SYNTHETIC_STALLS.map((stall) => (
                    <MenuItem key={stall.id} value={stall.id} sx={{ fontFamily: '"Outfit", sans-serif', color: '#2A1617' }}>
                      {stall.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <TextField
                label="Image URL (optional)"
                value={form.imageUrl}
                onChange={handleChange('imageUrl')}
                fullWidth
                size="small"
                placeholder="https://..."
                sx={fieldSx}
              />
            </Box>
          </Grid>

          {/* Dietary Tags */}
          <Grid item xs={12}>
            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 13, color: 'rgba(255,251,151,0.6)', mb: 1 }}>
              Dietary Info
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.8}>
              {DIETARY_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  onClick={() => toggleDietary(opt)}
                  size="small"
                  sx={{
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    background: form.dietaryInfo.includes(opt)
                      ? 'linear-gradient(135deg, #FE7F42, #B32C1A)'
                      : 'rgba(255,255,255,0.06)',
                    color: form.dietaryInfo.includes(opt) ? '#FFFB97' : 'rgba(255,251,151,0.55)',
                    border: form.dietaryInfo.includes(opt)
                      ? '1px solid transparent'
                      : '1px solid rgba(255,251,151,0.15)',
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 0.85 },
                  }}
                />
              ))}
            </Box>
          </Grid>

          {/* Popular toggle */}
          <Grid item xs={12}>
            <Box
              onClick={() => setForm((prev) => ({ ...prev, popular: !prev.popular }))}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                background: form.popular ? 'rgba(254,127,66,0.15)' : 'rgba(255,255,255,0.04)',
                border: form.popular ? '1.5px solid rgba(254,127,66,0.4)' : '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                px: 2,
                py: 1,
                transition: 'all 0.2s',
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: form.popular ? 'linear-gradient(135deg, #FE7F42, #B32C1A)' : 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {form.popular && <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFB97"><path d="M20 6L9 17l-5-5"/></svg>}
              </Box>
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 13, color: form.popular ? '#FE7F42' : 'rgba(255,251,151,0.55)', fontWeight: 600 }}>
                🔥 Mark as Popular
              </Typography>
            </Box>
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Box
              component="button"
              type="submit"
              sx={{
                width: '100%',
                background: 'linear-gradient(135deg, #FE7F42 0%, #B32C1A 100%)',
                color: '#FFFB97',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                fontSize: 16,
                py: 1.8,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'opacity 0.2s, transform 0.15s',
                boxShadow: '0 8px 24px rgba(254,127,66,0.3)',
                '&:hover': { opacity: 0.88, transform: 'translateY(-1px)' },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              <PlusIcon /> Add to Fan Swipe Feed
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Existing Items List */}
      <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 17, color: '#FFFB97', mb: 2 }}>
        Menu Items ({items.length})
      </Typography>

      <Box display="flex" flexDirection="column" gap={1.5}>
        {items.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              p: 1.5,
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: 'rgba(254,127,66,0.3)' },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '12px',
                backgroundImage: `url(${item.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0,
              }}
            />
            <Box flex={1} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 14, color: '#FFFB97' }}>
                  {item.name}
                </Typography>
                {item.popular && (
                  <Typography sx={{ fontSize: 11, color: '#FE7F42' }}>🔥</Typography>
                )}
                {item.id.startsWith('food-custom') && (
                  <Chip label="NEW" size="small" sx={{ background: 'rgba(76,175,80,0.2)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)', fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 10, height: 18 }} />
                )}
              </Box>
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 12, color: '#FE7F42', fontWeight: 600 }}>
                ${item.price.toFixed(2)} · {item.stallName} · {item.category}
              </Typography>
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: 'rgba(255,251,151,0.45)', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.description}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => handleDelete(item.id)}
              sx={{ background: 'rgba(179,44,26,0.1)', '&:hover': { background: 'rgba(179,44,26,0.25)' }, flexShrink: 0 }}
            >
              <TrashIcon />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.type} sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddFoodItem;

import React, { useState } from 'react';
import { UtensilsCrossed, Clock, Leaf, Heart, ChevronDown, ChevronUp, CheckCircle2, Info } from 'lucide-react';

const MealPlanner = () => {
    const [selectedDiet, setSelectedDiet] = useState('dash');
    const [selectedMealTime, setSelectedMealTime] = useState('breakfast');
    const [expandedMeal, setExpandedMeal] = useState(null);
    const [savedMeals, setSavedMeals] = useState([]);

    const dietProfiles = {
        dash: {
            name: 'DASH Diet',
            description: 'Dietary Approaches to Stop Hypertension',
            icon: Heart,
            color: '#b8916d',
            bg: '#f5f0e8',
            focus: 'Low sodium, rich in potassium, calcium, and magnesium'
        },
        lowGlycemic: {
            name: 'Low-Glycemic',
            description: 'Blood sugar management',
            icon: Leaf,
            color: '#6b8e7f',
            bg: '#e8f0ed',
            focus: 'Slow-release carbohydrates, high fiber, controlled portions'
        }
    };

    const mealSuggestions = {
        dash: {
            breakfast: [
                {
                    id: 1,
                    name: 'Oatmeal Power Bowl',
                    description: 'Steel-cut oats with berries and almonds',
                    servings: '1 bowl',
                    prepTime: '10 min',
                    sodium: '50mg',
                    potassium: '450mg',
                    ingredients: [
                        '½ cup steel-cut oats',
                        '1 cup unsweetened almond milk',
                        '¼ cup fresh blueberries',
                        '1 tbsp sliced almonds',
                        '½ banana, sliced',
                        'Cinnamon to taste'
                    ],
                    nutritionHighlights: 'High fiber, low sodium, potassium-rich'
                },
                {
                    id: 2,
                    name: 'Veggie Egg White Scramble',
                    description: 'Spinach, tomatoes, and bell peppers',
                    servings: '1 plate',
                    prepTime: '15 min',
                    sodium: '120mg',
                    potassium: '520mg',
                    ingredients: [
                        '3 egg whites',
                        '1 cup fresh spinach',
                        '½ cup cherry tomatoes',
                        '¼ cup bell peppers, diced',
                        '1 slice whole grain toast',
                        'Black pepper and herbs'
                    ],
                    nutritionHighlights: 'High protein, low fat, vegetable-rich'
                }
            ],
            lunch: [
                {
                    id: 3,
                    name: 'Quinoa Buddha Bowl',
                    description: 'Colorful vegetables with tahini dressing',
                    servings: '1 large bowl',
                    prepTime: '20 min',
                    sodium: '180mg',
                    potassium: '680mg',
                    ingredients: [
                        '¾ cup cooked quinoa',
                        '1 cup roasted vegetables (carrots, broccoli, bell peppers)',
                        '½ cup chickpeas',
                        '2 tbsp tahini dressing (homemade)',
                        'Fresh herbs and lemon',
                        '¼ avocado, sliced'
                    ],
                    nutritionHighlights: 'Complete protein, high fiber, heart-healthy fats'
                },
                {
                    id: 4,
                    name: 'Grilled Salmon Salad',
                    description: 'Omega-3 rich fish with mixed greens',
                    servings: '1 large plate',
                    prepTime: '25 min',
                    sodium: '150mg',
                    potassium: '750mg',
                    ingredients: [
                        '4 oz grilled salmon',
                        '2 cups mixed greens',
                        '½ cup cucumber, sliced',
                        '¼ cup red onion',
                        '1 tbsp olive oil',
                        'Lemon juice and herbs'
                    ],
                    nutritionHighlights: 'Omega-3 fatty acids, low sodium, anti-inflammatory'
                }
            ],
            dinner: [
                {
                    id: 5,
                    name: 'Herb-Roasted Chicken',
                    description: 'Skinless chicken with roasted vegetables',
                    servings: '1 plate',
                    prepTime: '35 min',
                    sodium: '140mg',
                    potassium: '620mg',
                    ingredients: [
                        '4 oz skinless chicken breast',
                        '1 cup roasted Brussels sprouts',
                        '½ cup roasted sweet potato',
                        'Fresh rosemary and thyme',
                        '1 tsp olive oil',
                        'Garlic and black pepper'
                    ],
                    nutritionHighlights: 'Lean protein, potassium-rich, low sodium'
                }
            ]
        },
        lowGlycemic: {
            breakfast: [
                {
                    id: 6,
                    name: 'Greek Yogurt Parfait',
                    description: 'Unsweetened yogurt with nuts and berries',
                    servings: '1 bowl',
                    prepTime: '5 min',
                    glycemicIndex: 'Low (GI: 35)',
                    fiber: '6g',
                    ingredients: [
                        '1 cup plain Greek yogurt (unsweetened)',
                        '¼ cup mixed berries (strawberries, raspberries)',
                        '2 tbsp chopped walnuts',
                        '1 tbsp chia seeds',
                        '½ tsp vanilla extract',
                        'Optional: stevia to taste'
                    ],
                    nutritionHighlights: 'High protein, low sugar, sustained energy'
                },
                {
                    id: 7,
                    name: 'Almond Butter Toast',
                    description: 'Whole grain bread with healthy fats',
                    servings: '2 slices',
                    prepTime: '5 min',
                    glycemicIndex: 'Low (GI: 42)',
                    fiber: '8g',
                    ingredients: [
                        '2 slices whole grain bread',
                        '2 tbsp natural almond butter',
                        '½ apple, sliced thin',
                        'Cinnamon sprinkle',
                        'Optional: hemp seeds'
                    ],
                    nutritionHighlights: 'Balanced macros, slow-release energy'
                }
            ],
            lunch: [
                {
                    id: 8,
                    name: 'Lentil & Veggie Soup',
                    description: 'Protein-rich legumes with vegetables',
                    servings: '2 cups',
                    prepTime: '30 min',
                    glycemicIndex: 'Low (GI: 32)',
                    fiber: '12g',
                    ingredients: [
                        '1 cup cooked green lentils',
                        '1 cup diced tomatoes',
                        '½ cup carrots, diced',
                        '½ cup celery',
                        '2 cups low-sodium vegetable broth',
                        'Cumin, turmeric, and bay leaf'
                    ],
                    nutritionHighlights: 'High fiber, plant protein, filling'
                }
            ],
            dinner: [
                {
                    id: 9,
                    name: 'Cauliflower Rice Stir-Fry',
                    description: 'Low-carb alternative with lean protein',
                    servings: '1 large bowl',
                    prepTime: '20 min',
                    glycemicIndex: 'Very Low (GI: 15)',
                    fiber: '5g',
                    ingredients: [
                        '2 cups riced cauliflower',
                        '4 oz tofu or chicken',
                        '1 cup mixed vegetables (broccoli, snap peas, carrots)',
                        '1 tbsp sesame oil',
                        '2 tbsp low-sodium soy sauce',
                        'Ginger and garlic'
                    ],
                    nutritionHighlights: 'Very low glycemic, high volume, nutrient-dense'
                }
            ]
        }
    };

    const currentDiet = dietProfiles[selectedDiet];
    const currentMeals = mealSuggestions[selectedDiet][selectedMealTime];

    const toggleMealExpansion = (mealId) => {
        setExpandedMeal(expandedMeal === mealId ? null : mealId);
    };

    const saveMeal = (meal) => {
        if (!savedMeals.find(m => m.id === meal.id)) {
            setSavedMeals([...savedMeals, meal]);
        }
    };

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
            fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
        }}>
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-semibold mb-3" style={{ color: '#4a5568' }}>
                        Meal Planner
                    </h1>
                    <p style={{ color: '#718096', fontSize: '16px' }}>
                        Evidence-based meal combinations for your health goals
                    </p>
                </div>

                {/* Diet Profile Selection */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: '#4a5568' }}>
                        Select Your Diet Profile
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(dietProfiles).map(([key, profile]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedDiet(key)}
                                className="p-6 rounded-2xl text-left transition-all"
                                style={{
                                    background: selectedDiet === key ? profile.bg : '#fafaf8',
                                    border: selectedDiet === key ? `3px solid ${profile.color}` : '2px solid #d4cfc4',
                                    minHeight: '120px'
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl" style={{ 
                                        background: selectedDiet === key ? profile.color + '20' : '#f0ebe5'
                                    }}>
                                        <profile.icon className="w-6 h-6" style={{ color: profile.color }} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1" style={{ 
                                            color: '#4a5568',
                                            fontSize: '17px'
                                        }}>
                                            {profile.name}
                                        </h3>
                                        <p className="text-sm mb-2" style={{ color: '#9ca3af' }}>
                                            {profile.description}
                                        </p>
                                        <p className="text-xs" style={{ color: '#718096' }}>
                                            {profile.focus}
                                        </p>
                                    </div>
                                    {selectedDiet === key && (
                                        <CheckCircle2 className="w-6 h-6" style={{ color: profile.color }} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Meal Time Selection */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: '#4a5568' }}>
                        Choose Meal Time
                    </h2>
                    <div className="flex gap-3 flex-wrap">
                        {['breakfast', 'lunch', 'dinner'].map((time) => (
                            <button
                                key={time}
                                onClick={() => setSelectedMealTime(time)}
                                className="px-6 py-3 rounded-xl font-medium transition-all capitalize"
                                style={{
                                    background: selectedMealTime === time ? currentDiet.bg : '#f0ebe5',
                                    color: selectedMealTime === time ? currentDiet.color : '#718096',
                                    border: selectedMealTime === time ? `2px solid ${currentDiet.color}` : '2px solid transparent',
                                    minHeight: '52px',
                                    fontSize: '15px'
                                }}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Meal Suggestions */}
                <div className="space-y-4 mb-10">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: '#4a5568' }}>
                        Suggested Meals
                    </h2>
                    {currentMeals.map((meal) => (
                        <div
                            key={meal.id}
                            className="rounded-2xl shadow-sm overflow-hidden"
                            style={{
                                background: '#fafaf8',
                                border: '2px solid #d4cfc4'
                            }}
                        >
                            <button
                                onClick={() => toggleMealExpansion(meal.id)}
                                className="w-full p-6 flex items-center justify-between transition-all"
                                style={{ minHeight: '88px' }}
                            >
                                <div className="flex items-center gap-4 flex-1 text-left">
                                    <div className="p-3 rounded-xl" style={{ background: currentDiet.bg }}>
                                        <UtensilsCrossed className="w-6 h-6" style={{ color: currentDiet.color }} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1" style={{ 
                                            color: '#4a5568',
                                            fontSize: '17px'
                                        }}>
                                            {meal.name}
                                        </h3>
                                        <p style={{ color: '#718096', fontSize: '14px' }}>
                                            {meal.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1 text-xs" style={{ color: '#9ca3af' }}>
                                                <Clock className="w-3 h-3" />
                                                {meal.prepTime}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded" style={{
                                                background: currentDiet.bg,
                                                color: currentDiet.color
                                            }}>
                                                {meal.servings}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {expandedMeal === meal.id ? 
                                    <ChevronUp className="w-6 h-6" style={{ color: '#9ca3af' }} /> : 
                                    <ChevronDown className="w-6 h-6" style={{ color: '#9ca3af' }} />
                                }
                            </button>

                            {/* Expanded Details */}
                            {expandedMeal === meal.id && (
                                <div className="px-6 pb-6">
                                    <div className="p-5 rounded-xl mb-4" style={{ background: '#f0ebe5' }}>
                                        <div className="flex items-start gap-2 mb-3">
                                            <Info className="w-5 h-5 mt-0.5" style={{ color: currentDiet.color }} />
                                            <div>
                                                <h4 className="font-semibold mb-1" style={{ color: '#4a5568', fontSize: '15px' }}>
                                                    Nutrition Highlights
                                                </h4>
                                                <p className="text-sm" style={{ color: '#718096' }}>
                                                    {meal.nutritionHighlights}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedDiet === 'dash' && (
                                            <div className="grid grid-cols-2 gap-4 mt-3">
                                                <div>
                                                    <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                                                        Sodium
                                                    </span>
                                                    <p className="font-semibold" style={{ color: '#4a5568' }}>
                                                        {meal.sodium}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                                                        Potassium
                                                    </span>
                                                    <p className="font-semibold" style={{ color: '#4a5568' }}>
                                                        {meal.potassium}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDiet === 'lowGlycemic' && (
                                            <div className="grid grid-cols-2 gap-4 mt-3">
                                                <div>
                                                    <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                                                        Glycemic Index
                                                    </span>
                                                    <p className="font-semibold" style={{ color: '#4a5568' }}>
                                                        {meal.glycemicIndex}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                                                        Fiber
                                                    </span>
                                                    <p className="font-semibold" style={{ color: '#4a5568' }}>
                                                        {meal.fiber}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-3" style={{ color: '#4a5568', fontSize: '15px' }}>
                                            Ingredients
                                        </h4>
                                        <ul className="space-y-2">
                                            {meal.ingredients.map((ingredient, i) => (
                                                <li key={i} className="flex items-center gap-2" style={{ color: '#718096', fontSize: '14px' }}>
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentDiet.color }}></div>
                                                    {ingredient}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => saveMeal(meal)}
                                        className="w-full px-6 py-3 rounded-xl font-medium transition-all"
                                        style={{
                                            background: currentDiet.bg,
                                            color: currentDiet.color,
                                            border: `2px solid ${currentDiet.color}`,
                                            minHeight: '52px',
                                            fontSize: '15px'
                                        }}
                                    >
                                        {savedMeals.find(m => m.id === meal.id) ? 'Saved to Meal Plan' : 'Add to Meal Plan'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Saved Meals Summary */}
                {savedMeals.length > 0 && (
                    <div className="p-8 rounded-2xl shadow-sm" style={{
                        background: 'linear-gradient(135deg, #e8f0ed 0%, #d9ead3 100%)',
                        border: '2px solid #b8d4a8'
                    }}>
                        <h3 className="font-semibold mb-4" style={{ color: '#4a5568', fontSize: '18px' }}>
                            Your Meal Plan ({savedMeals.length} meals saved)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {savedMeals.map((meal) => (
                                <div key={meal.id} className="p-4 rounded-xl" style={{
                                    background: '#ffffff',
                                    border: '1px solid #b8d4a8'
                                }}>
                                    <p className="font-medium" style={{ color: '#4a5568', fontSize: '14px' }}>
                                        {meal.name}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                                        {meal.prepTime} • {meal.servings}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lexend:wght@300;400;500;600&display=swap');
                
                * {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                button {
                    cursor: pointer;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default MealPlanner;

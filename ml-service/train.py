import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
import joblib

def main():
    print("Loading dataset...")
    # The dataset has an issue with some lines having an extra comma? Let's fix that or ignore bad lines.
    # Actually, pd.read_csv("dataset.csv", on_bad_lines='skip') is safer.
    df = pd.read_csv("dataset.csv", on_bad_lines='skip')

    print(f"Loaded {len(df)} rows.")

    # Drop rows with null text or category
    df = df.dropna(subset=['Text', 'Category'])

    # Strip whitespaces
    df['Text'] = df['Text'].str.strip()
    df['Category'] = df['Category'].str.strip()

    # Map categories exactly to user's requested categories
    category_mapping = {
        'Pothole': 'Potholes',
        'Garbage': 'Garbage',
        'Water Supply & Drainage': 'Water Leakage',
        'Streetlight Issue': 'Streetlight Issue',
        'Treefall': 'Treefall',
        'Traffic Light': 'Traffic Light',
        'Others': 'Others (Valid Civic Issues)',
        'Invalid': 'Invalid (Noise/Spam)'
    }

    
    df['MappedCategory'] = df['Category'].map(category_mapping)
    df = df.dropna(subset=['MappedCategory'])

    # --- DATA AUGMENTATION (Synonyms & Indirect Descriptions) ---
    # that don't explicitly contain the category name (like "uneven surface" -> "Potholes").
    augmented_data = [
        {"Text": "The surface is extremely uneven and vehicles are shaking.", "MappedCategory": "Potholes"},
        {"Text": "Rough stretch of road, suspension getting damaged, bumpy ride.", "MappedCategory": "Potholes"},
        {"Text": "Road is completely shattered, big crater, very difficult to drive.", "MappedCategory": "Potholes"},
        
        {"Text": "Foul smell, rotting food, disgusting odor on the street corner.", "MappedCategory": "Garbage"},
        {"Text": "Waste bags everywhere, flies swarming the dump.", "MappedCategory": "Garbage"},
        
        {"Text": "Huge puddle of clear water wasting away, pipe has burst.", "MappedCategory": "Water Leakage"},
        {"Text": "Water is overflowing from the underground valve to the road.", "MappedCategory": "Water Leakage"},
        
        {"Text": "It's pitch black here at night, bulb is fused, no illumination.", "MappedCategory": "Streetlight Issue"},
        {"Text": "Dark road, completely dark stretch, no lights working.", "MappedCategory": "Streetlight Issue"},

        {"Text": "Huge branch broke off and is blocking the lane.", "MappedCategory": "Treefall"},
        {"Text": "Trunk uprooted on the pavement after the storm.", "MappedCategory": "Treefall"},
        
        {"Text": "Red and green lamps are not switching, massive traffic jam.", "MappedCategory": "Traffic Light"},
        {"Text": "Intersection timer is blank, no signal working.", "MappedCategory": "Traffic Light"},
    ]
    
    # We multiply this augmented data to give it enough weight against 1600 dataset rows
    df_aug = pd.DataFrame(augmented_data * 15)  
    df = pd.concat([df, df_aug], ignore_index=True)
    # -------------------------------------------------------------

    print(f"Data ready for training: {len(df)} rows.")
    print("Categories distribution:")
    print(df['MappedCategory'].value_counts())

    X = df['Text']
    y = df['MappedCategory']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("\nTraining TF-IDF + Logistic Regression pipeline...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', ngram_range=(1,2), max_features=5000)),
        ('clf', LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42))
    ])

    pipeline.fit(X_train, y_train)

    print("\nEvaluating model:")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))

    print("Saving model to nlp_model.pkl...")
    joblib.dump(pipeline, 'nlp_model.pkl')
    print("Done!")

if __name__ == "__main__":
    main()

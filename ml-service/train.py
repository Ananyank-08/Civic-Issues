import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


CATEGORY_MAPPING = {
    'pothole': 'Potholes',
    'potholes': 'Potholes',
    'garbage': 'Garbage',
    'waste': 'Garbage',
    'water supply & drainage': 'Water Leakage',
    'water leakage': 'Water Leakage',
    'drainage': 'Water Leakage',
    'streetlight issue': 'Streetlight Issue',
    'streetlight': 'Streetlight Issue',
    'street light': 'Streetlight Issue',
    'street lights': 'Streetlight Issue',
    'treefall': 'Treefall',
    'tree fall': 'Treefall',
    'fallen tree': 'Treefall',
    'traffic light': 'Traffic Light',
    'traffic signal': 'Traffic Light',
    'signal': 'Traffic Light',
    'others': 'Others (Valid Civic Issues)',
    'other': 'Others (Valid Civic Issues)',
    'invalid': 'Invalid (Noise/Spam)',
    'noise/spam': 'Invalid (Noise/Spam)',
}


def normalize_category(raw_category: str):
    if pd.isna(raw_category):
        return None

    normalized = str(raw_category).strip().lower()
    normalized = ' '.join(normalized.replace('_', ' ').replace('-', ' ').split())
    return CATEGORY_MAPPING.get(normalized)


def print_confusion_summary(y_true, y_pred):
    labels = sorted(set(y_true))
    matrix = confusion_matrix(y_true, y_pred, labels=labels)

    print("\nConfusion matrix labels:")
    for idx, label in enumerate(labels):
        print(f"{idx}: {label}")

    print("\nTop confusions:")
    for row_index, actual_label in enumerate(labels):
        row = matrix[row_index]
        confusions = []
        for col_index, predicted_label in enumerate(labels):
            if row_index != col_index and row[col_index] > 0:
                confusions.append((int(row[col_index]), predicted_label))
        confusions.sort(reverse=True)
        print(f"{actual_label}: {confusions[:3]}")


def main():
    print("Loading dataset...")
    df = pd.read_csv("dataset.csv", on_bad_lines='skip')

    print(f"Loaded {len(df)} rows.")

    df = df.dropna(subset=['Text', 'Category'])
    df['Text'] = df['Text'].astype(str).str.strip()
    df['Category'] = df['Category'].astype(str).str.strip()

    df['MappedCategory'] = df['Category'].apply(normalize_category)

    unmapped = df[df['MappedCategory'].isna()]['Category'].value_counts()
    if not unmapped.empty:
        print("\nWarning: unmapped categories found and skipped:")
        print(unmapped)

    df = df.dropna(subset=['MappedCategory'])

    augmented_data = [
        {"Text": "The surface is extremely uneven and vehicles are shaking.", "MappedCategory": "Potholes"},
        {"Text": "Rough stretch of road, suspension getting damaged, bumpy ride.", "MappedCategory": "Potholes"},
        {"Text": "Road is completely shattered, big crater, very difficult to drive.", "MappedCategory": "Potholes"},

        {"Text": "Foul smell, rotting food, disgusting odor on the street corner.", "MappedCategory": "Garbage"},
        {"Text": "Waste bags everywhere, flies swarming the dump.", "MappedCategory": "Garbage"},

        {"Text": "Huge puddle of clear water wasting away, pipe has burst.", "MappedCategory": "Water Leakage"},
        {"Text": "Water is overflowing from the underground valve to the road.", "MappedCategory": "Water Leakage"},
        {"Text": "Fresh water is leaking from the municipal supply pipe near the junction.", "MappedCategory": "Water Leakage"},
        {"Text": "A cracked water main is spraying clean water onto the road continuously.", "MappedCategory": "Water Leakage"},
        {"Text": "Leakage from the public tap connection is forming a clear puddle near the footpath.", "MappedCategory": "Water Leakage"},
        {"Text": "The underground drinking water line has burst and water is seeping through the road.", "MappedCategory": "Water Leakage"},
        {"Text": "The water meter chamber is overflowing because of a leaking supply valve.", "MappedCategory": "Water Leakage"},
        {"Text": "Clean water is trickling from a broken pipe beside the market wall.", "MappedCategory": "Water Leakage"},
        {"Text": "There is constant seepage from the service pipe near our house connection.", "MappedCategory": "Water Leakage"},

        {"Text": "It's pitch black here at night, bulb is fused, no illumination.", "MappedCategory": "Streetlight Issue"},
        {"Text": "Dark road, completely dark stretch, no lights working.", "MappedCategory": "Streetlight Issue"},
        {"Text": "Lamp post is dead and the street is unsafe after sunset.", "MappedCategory": "Streetlight Issue"},
        {"Text": "Street lamp is flickering all night and the road stays dim.", "MappedCategory": "Streetlight Issue"},
        {"Text": "No illumination from the roadside light pole near the colony gate.", "MappedCategory": "Streetlight Issue"},
        {"Text": "The lamp post on this street is off and pedestrians cannot see the road at night.", "MappedCategory": "Streetlight Issue"},
        {"Text": "Street lighting has failed on the service road and the whole stretch is dark.", "MappedCategory": "Streetlight Issue"},
        {"Text": "The light pole outside the apartment is fused and visibility is very poor after sunset.", "MappedCategory": "Streetlight Issue"},
        {"Text": "Roadside lamp is blinking continuously and not giving proper illumination.", "MappedCategory": "Streetlight Issue"},
        {"Text": "The neighborhood street lamp is dead, but the traffic junction signal is working fine.", "MappedCategory": "Streetlight Issue"},

        {"Text": "Huge branch broke off and is blocking the lane.", "MappedCategory": "Treefall"},
        {"Text": "Trunk uprooted on the pavement after the storm.", "MappedCategory": "Treefall"},

        {"Text": "Red and green lamps are not switching, massive traffic jam.", "MappedCategory": "Traffic Light"},
        {"Text": "Intersection timer is blank, no signal working.", "MappedCategory": "Traffic Light"},
        {"Text": "Traffic signal at the junction is stuck on red for every lane.", "MappedCategory": "Traffic Light"},
        {"Text": "Pedestrian crossing light is dead and vehicles are moving randomly.", "MappedCategory": "Traffic Light"},
        {"Text": "Signal controller at the intersection is malfunctioning and causing jams.", "MappedCategory": "Traffic Light"},
        {"Text": "The junction signal is stuck on amber and vehicles from all sides are confused.", "MappedCategory": "Traffic Light"},
        {"Text": "Traffic lights at the crossroads are not changing and a jam is building up.", "MappedCategory": "Traffic Light"},
        {"Text": "The red green signal cycle at the intersection has stopped working.", "MappedCategory": "Traffic Light"},
        {"Text": "Pedestrian crossing signal near the school is blank and unsafe during rush hour.", "MappedCategory": "Traffic Light"},
        {"Text": "The traffic controller box at the main junction has failed and signals are blinking incorrectly.", "MappedCategory": "Traffic Light"},
        {"Text": "Intersection lights are malfunctioning, but the street lamps nearby are normal.", "MappedCategory": "Traffic Light"},

        {"Text": "Stray dogs are chasing school children near the bus stop every evening.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Illegal roadside encroachment is blocking the footpath for pedestrians.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Public park swings are broken and rusted, making them unsafe for children.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Abandoned vehicle has been occupying the roadside parking area for months.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Loud noise from a nearby event hall continues late into the night.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "A no parking sign is needed near the hospital emergency gate.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Public toilet is unusable and badly maintained in the market area.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Illegal posters and banners are covering the public compound walls.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Stray cattle are sitting in the middle of the road and causing traffic problems.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Overgrown weeds along the roadside are blocking visibility for motorists.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Speed breaker is needed near the school crossing for child safety.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Open manhole on the sidewalk is hidden by grass and is dangerous to pedestrians.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Unauthorized bus parking on the roadside is creating congestion every morning.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Heavy dust from the nearby construction site is affecting residents.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Public fountain has stagnant water and is breeding mosquitoes in the park.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Public toilet has no running water and is extremely dirty, but there is no pipe leakage outside.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Mosquitoes are breeding in stagnant water inside the park fountain, but no water pipeline is leaking.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "The footpath is broken and water collects there after rain, but no tap or pipe is leaking.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Unauthorized debris is dumped near the drain and creating blockage, not a clean water leak.", "MappedCategory": "Others (Valid Civic Issues)"},
        {"Text": "Public washroom maintenance is poor and hygiene is bad, but there is no burst pipe.", "MappedCategory": "Others (Valid Civic Issues)"},

        {"Text": "I forgot my water bottle at the bus stop this morning.", "MappedCategory": "Invalid (Noise/Spam)"},
        {"Text": "Can someone recommend a good plumber for my private kitchen tap at home?", "MappedCategory": "Invalid (Noise/Spam)"},
        {"Text": "Rain water entered my shoes while I was walking and it was annoying.", "MappedCategory": "Invalid (Noise/Spam)"},
        {"Text": "I spilled a glass of water on my table while studying.", "MappedCategory": "Invalid (Noise/Spam)"},
        {"Text": "My apartment shower is dripping and I need a personal repair contact.", "MappedCategory": "Invalid (Noise/Spam)"},
    ]

    df_aug = pd.DataFrame(augmented_data * 15)
    df = pd.concat([df, df_aug], ignore_index=True)

    print(f"Data ready for training: {len(df)} rows.")
    print("Categories distribution:")
    print(df['MappedCategory'].value_counts())

    X = df['Text']
    y = df['MappedCategory']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTraining TF-IDF + Logistic Regression pipeline...")
    pipeline = Pipeline([
        (
            'tfidf',
            TfidfVectorizer(
                stop_words='english',
                ngram_range=(1, 3),
                max_features=8000,
                min_df=2,
                sublinear_tf=True,
                strip_accents='unicode',
            ),
        ),
        (
            'clf',
            LogisticRegression(
                class_weight='balanced',
                max_iter=1500,
                random_state=42,
                C=1.5,
            ),
        ),
    ])

    pipeline.fit(X_train, y_train)

    print("\nEvaluating model:")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))
    print_confusion_summary(y_test, y_pred)

    print("\nSaving model to nlp_model.pkl...")
    joblib.dump(pipeline, 'nlp_model.pkl')
    print("Done!")


if __name__ == "__main__":
    main()

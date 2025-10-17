export class AchievementModel extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["MOSH.Item"];

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      img: new fields.ImageField({
        required: false,
        blank: true,
        initial: "modules/mothership-crew-achievements/images/default.webp",
      }),
      description: new fields.HTMLField({
        required: false,
        blank: true,
        initial: "",
      }),
      effects: new fields.ArrayField(
        new fields.SchemaField({
          effectType: new fields.EnumerationField({
            required: true,
            options: [
              "statMod",
              "skillMod",
              "advantage",
              "disadvantage",
              "custom",
            ],
          }),
          stat: new fields.StringField({ required: false }),
          skill: new fields.StringField({ required: false }),
          bonus: new fields.NumberField({ required: false }),
          customDescription: new fields.StringField({ required: false }),
        }),
        { required: false, initial: [] }
      ),
    };
  }
}

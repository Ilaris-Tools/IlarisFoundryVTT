export function buildTypeDataFieldHelpers(fields) {
    const number = (initial = 0, nullable = true) =>
        new fields.NumberField({ required: false, nullable, initial })
    const string = (initial = '') =>
        new fields.StringField({ required: false, nullable: true, blank: true, initial })
    const bool = (initial = false) => new fields.BooleanField({ required: false, initial })
    const schema = (shape) => new fields.SchemaField(shape, { required: false, nullable: true })
    const arrayOfStrings = () =>
        new fields.ArrayField(string(''), { required: false, nullable: true, initial: () => [] })
    const arrayOfObjects = () =>
        new fields.ArrayField(new fields.ObjectField({ required: false, nullable: true }), {
            required: false,
            nullable: true,
            initial: () => [],
        })
    const object = (initial = {}) =>
        new fields.ObjectField({
            required: false,
            nullable: true,
            initial: () => foundry.utils.deepClone(initial),
        })

    return {
        number,
        string,
        bool,
        schema,
        arrayOfStrings,
        arrayOfObjects,
        object,
    }
}

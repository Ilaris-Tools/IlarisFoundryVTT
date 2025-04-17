export class IlarisItem extends Item {
    setManoevers() {
        // TODO: könnte man vlt. dynamisch machen:
        // alle aus dem pack und dann vorteile prüfen
        console.log(this)
        this.system.manoever.kbak = {selected: false}
        // TODO: deepcopy from config hier rein und filtern 
        // oder possible flag setzen je nach vorteilen des owners.
    }
}
import json
import xmltodict

'''
Sephrasto main 25.04.2021
## Vorteil
typ = 0         Allgemein (4)
typ = 1         Profan (568)
typ = 2         Kampf (895)
typ = 3         Kampfstil (1179)
typ = 4         Magie (1434)
typ = 5         Tradition Zauber (1675)
typ = 6         Karma (2325)
typ = 7         Tradition Karma (2485)
typ = 8         Tradition Paktierer (3205)
## Fertigkeiten:
printclass=0    Nahkampf (12107)
printclass=1    Fernkampf (12144)
printclass=2    Körper (12161)
printclass=3    Gesellschaft (12197)
printclass=4    Wissen (12224)
printclass=5    Natur (12251)
printclass=6    Handwerk (12260)
## Talente:
printclass=-1       Profan (3243)
printclass=[0,19]   Zauber (3935)
printclass=[20,55]  Liturgien (8985)
printclass=99       Mirakel (11275)
printclass=299      Dämonische Stärkung (11605)
printclass=200      Dämonisch
## Manöver
typ = 0         Nahkampf (14490)
typ = 1         Fernkampf (14682)
typ = 2         Magie (14738)
typ = 3         Karma (14810)
typ = 4         Antimage-Eigenschaften-... (15042)
typ = 6         paktierer (14987)
'''


class Exporter:
    def __init__(self, path_db, path_json):
        self.path_db = path_db
        self.path_json = path_json
        self.data_dict = self._open_database()
        self.datenbank = self._datenbank()
        self._prof_tal = -1
        self._zauber_min = 0
        self._zauber_max = 19
        self._liturgie_min = 20
        self._liturgie_max = 55
        self._mirakel = 99
        self._daemonisch_staerkung = 299
        self._daemonisch_min = 200
        self._daemonisch_max = 200

    def _open_database(self):
        with open(self.path_db) as xml_file:
            data_dict = xmltodict.parse(xml_file.read(), process_namespaces=True)
        return data_dict

    def _save_database(self):
        json_data = json.dumps(self.datenbank, ensure_ascii=False)
        with open(self.path_json, "w") as json_file:
            json_file.write("export default " + json_data)

    def _datenbank(self):
        datenbank = {"datenbank": {
            "nahkampfwaffen": [],
            "fernkampfwaffen": [],
            "fertigkeiten": [],
            "talente": [],
            "liturgien": [],
            "zauber": [],
            "daemonisch": [],
            "uebernatuerliche_fertigkeiten": [],
            "vorteile": [],
            "manoever": []
        }}
        return datenbank

    awwL  :2
    def __create_nahkampfwaffe(self, item):
        Waffe = {
            "name": item["@name"],
            "type": "nahkampfwaffe",
            "data": {
                "dice_anzahl": int(item["@W6"]),
                "dice_plus": int(item["@plus"]),
                "haerte": int(item["@haerte"]),
                "fertigkeit": item["@fertigkeit"],
                "talent": item["@talent"],
                "rw": int(item["@rw"]),
                "wm_at": int(item["@wm"]),
                "wm_vt": int(item["@wm"]),
                "gewicht": 1,
                "eigenschaften": {
                    "kopflastig": "Kopflastig" in item.get("#text", ""),
                    "niederwerfen": "Niederwerfen" in item.get("#text", ""),
                    "parierwaffe": "Parierwaffe" in item.get("#text", ""),
                    "reittier": "Reittier" in item.get("#text", ""),
                    "ruestungsbrechend": "Rüstungsbrechend" in item.get("#text", ""),
                    "schild": "Schild" in item.get("#text", ""),
                    "schwer_4": "Schwer (4)" in item.get("#text", ""),
                    "schwer_8": "Schwer (8)" in item.get("#text", ""),
                    "stumpf": "Stumpf" in item.get("#text", ""),
                    "unberechenbar": "Unberechenbar" in item.get("#text", ""),
                    "unzerstoerbar": "Unzerstörbar" in item.get("#text", ""),
                    "wendig": "Wendig" in item.get("#text", ""),
                    "zerbrechlich": "Zerbrechlich" in item.get("#text", ""),
                    "zweihaendig": "Zweihändig" in item.get("#text", ""),
                    "kein_malus_nebenwaffe": "kein Malus als Nebenwaffe" in item.get("#text", ""),
                }
            }
        }
        gewicht = 1
        if (Waffe["data"]["eigenschaften"]["reittier"]):
            gewicht = -1
        elif (Waffe["data"]["eigenschaften"]["zweihaendig"]):
            gewicht = 2
        elif (Waffe["data"]["eigenschaften"]["schild"] and not Waffe["data"]["eigenschaften"]["parierwaffe"]):
            gewicht = 2
        Waffe["data"]["gewicht"] = gewicht
        return Waffe

    def __create_fernkampfwaffe(self, item):
        kein_reiter_nocaps = "nicht für Reiter" in item.get("#text", "")
        kein_reiter_caps = "Nicht für Reiter" in item.get("#text", "")
        kein_reiter = False
        if (kein_reiter_nocaps or kein_reiter_caps):
            kein_reiter = True
        Waffe = {
            "name": item["@name"],
            "type": "fernkampfwaffe",
            "data": {
                "dice_anzahl": int(item["@W6"]),
                "dice_plus": int(item["@plus"]),
                "haerte": int(item["@haerte"]),
                "fertigkeit": item["@fertigkeit"],
                "talent": item["@talent"],
                "rw": int(item["@rw"]),
                "lz": int(item["@lz"]),
                "gewicht": 1,
                "eigenschaften": {
                    # "kein_reiter": "nicht für Reiter" in item.get("#text", False) or "Nicht für Reiter" in item.get("#text", False),
                    "kein_reiter": kein_reiter,
                    "niederwerfen": "Niederwerfen" in item.get("#text", ""),
                    "niederwerfen_4": "Niederwerfen (-4)" in item.get("#text", ""),
                    "niederwerfen_8": "Niederwerfen (-8)" in item.get("#text", ""),
                    "schwer_4": "Schwer (4)" in item.get("#text", ""),
                    "schwer_8": "Schwer (8)" in item.get("#text", ""),
                    "stationaer": "Stationär" in item.get("#text", ""),
                    "stumpf": "Stumpf" in item.get("#text", ""),
                    "umklammern_212": "Umklammern (-2; 12)" in item.get("#text", ""),
                    "umklammern_416": "Umklammern (-4; 16)" in item.get("#text", ""),
                    "umklammern_816": "Umklammern (-8; 16)" in item.get("#text", ""),
                    "zweihaendig": "Zweihändig" in item.get("#text", ""),
                }
            }
        }
        if (Waffe["data"]["eigenschaften"]["niederwerfen_4"] == True or Waffe["data"]["eigenschaften"]["niederwerfen_8"] == True):
            Waffe["data"]["eigenschaften"]["niederwerfen"] = False
        gewicht = 1
        if (Waffe["data"]["eigenschaften"]["stationaer"]):
            gewicht = 3
        elif (Waffe["data"]["eigenschaften"]["zweihaendig"]):
            gewicht = 2
        Waffe["data"]["gewicht"] = gewicht
        return Waffe

    def __create_fertigkeit(self, item):
        attribute = item["@attribute"].split("|")
        attribut_0 = attribute[0]
        attribut_1 = attribute[1]
        attribut_2 = attribute[2]
        fertigkeit = {
            "name": item["@name"],
            "type": "",
            "data": {
                "attribut_0": attribut_0,
                "attribut_1": attribut_1,
                "attribut_2": attribut_2,
                "gruppe": int(item["@printclass"]),
                "text": item["#text"]
                }
            }
        return fertigkeit

    def __create_profan_fertigkeit(self, item):
        fertigkeit = self.__create_fertigkeit(item)
        fertigkeit["type"] = "fertigkeit"
        return fertigkeit


    def __create_talent(self, item):
        talent = {
            "name": item["@name"],
            "type": "talent",
            "data": {
                "fertigkeit": item["@fertigkeiten"],
                "text": item.get("#text", "")
            }
        }
        return talent

    def __create_uebernatuerlich_talent(self, item):
        gruppe = int(item["@printclass"])
        beschreibung = item["#text"]
        splitted = ''
        name = item["@name"]
        fertigkeiten = item["@fertigkeiten"]
        text = ''
        maechtig = ''
        schwierigkeit = ''
        modifikationen = ''
        vorbereitung = ''
        ziel = ''
        reichweite = ''
        wirkungsdauer = ''
        kosten = ''
        erlernen = ''
        anmerkungen = ''

        splitted = beschreibung.split("\nAnmerkungen: ")
        if (len(splitted) == 2):
            anmerkungen = splitted[1]
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nErlernen: ")
        if (len(splitted) == 2):
            erlernen = splitted[1]
            erlernen = erlernen.split(";")
            if ("EP" in erlernen[-1]):
                del erlernen[-1]
            erlernen = (";").join(erlernen)
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nFertigkeiten: ")
        if (len(splitted) == 2):
            pass
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nKosten: ")
        if (len(splitted) == 2):
            kosten = splitted[1]
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nWirkungsdauer: ")
        if (len(splitted) == 2):
            wirkungsdauer = splitted[1]
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nReichweite: ")
        if (len(splitted) == 2):
            reichweite = splitted[1]
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nZiel: ")
        if (len(splitted) == 2):
            ziel = splitted[1]
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nVorbereitungszeit: ")
        if (len(splitted) == 2):
            vorbereitung = splitted[1]
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nModifikationen: ")
        if (len(splitted) == 2):
            modifikationen = splitted[1]
        beschreibung = splitted[0]

        splitted = beschreibung.split("\nProbenschwierigkeit: ")
        if (len(splitted) == 2):
            schwierigkeit = splitted[1]
        beschreibung = splitted[0]

        if (gruppe >= self._zauber_min and gruppe <= self._zauber_max):
            splitted = beschreibung.split("\nMächtige Magie: ")
        elif ((gruppe >= self._liturgie_min and gruppe <= self._liturgie_max) or (gruppe == self._mirakel)):
            splitted = beschreibung.split("\nMächtige Liturgie: ")
        elif ((gruppe >= self._daemonisch_min and gruppe <= self._daemonisch_max) or (gruppe == self._daemonisch_staerkung)):
            splitted = beschreibung.split("\nMächtige Anrufung: ")
            # print("Hallo Mächtig")
        if (len(splitted) == 2):
            maechtig = splitted[1]
        text = splitted[0]

        if (anmerkungen != ''):
            text = text + "\nAnmerkungen: " + anmerkungen

        zauber = {
            "name": name,
            "type": "",
            "data": {
                "fertigkeiten": fertigkeiten,
                "text": text,
                "maechtig": maechtig,
                "schwierigkeit": schwierigkeit,
                "modifikationen": modifikationen,
                "vorbereitung": vorbereitung,
                "ziel": ziel,
                "reichweite": reichweite,
                "wirkungsdauer": wirkungsdauer,
                "kosten": kosten,
                "erlernen": erlernen,
                "gruppe": gruppe
            }
        }
        return zauber

    def __create_zauber(self, item):
        zauber = self.__create_uebernatuerlich_talent(item)
        zauber["type"] = "zauber"
        return zauber

    def __create_liturgie(self, item):
        liturgie = self.__create_uebernatuerlich_talent(item)
        liturgie["type"] = "liturgie"
        return liturgie

    def __create_daemonisch(self, item):
        daemonisch = self.__create_uebernatuerlich_talent(item)
        daemonisch["type"] = "daemonisch"
        return daemonisch

    def __create_uebernatuerliche_fertigkeit(self, item):
        fertigkeit = self.__create_fertigkeit(item)
        fertigkeit["type"] = "uebernatuerliche_fertigkeit"
        fertigkeit["data"]["voraussetzung"] = item["@voraussetzungen"]
        return fertigkeit

    def __create_vorteil(self, item):
        name = item["@name"]
        voraussetzung = item["@voraussetzungen"]
        gruppe = int(item["@typ"])
        text = item["#text"]
        vorteil = {
            "name": name,
            "type": "vorteil",
            "data": {
                "voraussetzung": voraussetzung,
                "gruppe": gruppe,
                "text": text
            }
        }
        return vorteil

    def __create_manoever(self, item):
        name = item["@name"]
        gruppe = int(item["@typ"])
        voraussetzung = item["@voraussetzungen"]
        probe = item.get("@probe", "")
        gegenprobe = item.get("@gegenprobe", "")
        text = item["#text"]
        manoever = {
            "name": name,
            "type": "manoever",
            "data": {
                "voraussetzung": voraussetzung,
                "gruppe": gruppe,
                "probe": probe,
                "gegenprobe": gegenprobe,
                "text": text
                }
        }
        return manoever

    def _import_waffen(self):
        for item in self.data_dict["Datenbank"]["Waffe"]:
            fk = int(item["@fk"])
            if (fk == 0):
                waffe = self.__create_nahkampfwaffe(item)
                self.datenbank["datenbank"]["nahkampfwaffen"].append(waffe)
            elif (fk == 1):
                waffe = self.__create_fernkampfwaffe(item)
                self.datenbank["datenbank"]["fernkampfwaffen"].append(waffe)

    def _import_fertigkeiten(self):
        for item in self.data_dict["Datenbank"]["Fertigkeit"]:
            fertigkeit = self.__create_profan_fertigkeit(item)
            self.datenbank["datenbank"]["fertigkeiten"].append(fertigkeit)

    def _import_talente(self):
        for item in self.data_dict["Datenbank"]["Talent"]:
            gruppe = int(item.get("@printclass", "-1"))
            if (gruppe == self._prof_tal):
                talent = self.__create_talent(item)
                self.datenbank["datenbank"]["talente"].append(talent)
            elif (gruppe >= self._zauber_min and gruppe <= self._zauber_max):
                zauber = self.__create_zauber(item)
                self.datenbank["datenbank"]["zauber"].append(zauber)
            elif (gruppe >= self._liturgie_min and gruppe <= self._liturgie_max):
                liturgie = self.__create_liturgie(item)
                self.datenbank["datenbank"]["liturgien"].append(liturgie)
            elif (gruppe == self._mirakel):
                mirakel = self.__create_liturgie(item)
                self.datenbank["datenbank"]["liturgien"].append(mirakel)
            elif (gruppe == self._daemonisch_staerkung):
                daemon_staerkung = self.__create_daemonisch(item)
                self.datenbank["datenbank"]["daemonisch"].append(daemon_staerkung)
            elif (gruppe >= self._daemonisch_min and gruppe <= self._daemonisch_max):
                daemon = self.__create_daemonisch(item)
                self.datenbank["datenbank"]["daemonisch"].append(daemon)

    def _import_uebernatuerliche_fertigkeiten(self):
        for item in self.data_dict["Datenbank"]["Übernatürliche-Fertigkeit"]:
            # gruppe = int(item["@printclass"])
            fertigkeit = self.__create_uebernatuerliche_fertigkeit(item)
            self.datenbank["datenbank"]["uebernatuerliche_fertigkeiten"].append(fertigkeit)

    def _import_vorteile(self):
        for item in self.data_dict["Datenbank"]["Vorteil"]:
            gruppe = int(item["@typ"])
            if (gruppe >= 0 and gruppe <= 7):
                vorteil = self.__create_vorteil(item)
                self.datenbank["datenbank"]["vorteile"].append(vorteil)

    def _import_manoever(self):
        for item in self.data_dict["Datenbank"]["Manöver"]:
            gruppe = int(item["@typ"])
            if (gruppe >= 0 and gruppe <= 3):
                manoever = self.__create_manoever(item)
                self.datenbank["datenbank"]["manoever"].append(manoever)

    def _xml_to_json(self):
        json_data = json.dumps(self.data_dict, ensure_ascii=False)
        with open("datenbank.json", "w") as json_file:
            json_file.write(json_data)

    def import_Sephrasto(self):
        self._import_waffen()
        self._import_fertigkeiten()
        self._import_talente()
        self._import_uebernatuerliche_fertigkeiten()
        self._import_vorteile()
        self._import_manoever()
        self._save_database()


if __name__ == "__main__":
    db = Exporter(path_db="/home/feorg/PnP_RPG/Ilaris/Sephrasto (alle Versionen)/Sephrasto/datenbank.xml",
                  path_json="./assets/sephrasto_datenbank.js")
    db.import_Sephrasto()
    # db._xml_to_json()

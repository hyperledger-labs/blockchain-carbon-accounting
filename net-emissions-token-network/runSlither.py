import subprocess
import glob, os

solFiles = []

def getSolFiles():
    os.chdir("backupContractDir")
    for file in glob.glob("*.sol"):
        print(file)
        solFiles.append(["backupContractDir/"+file, file])

    os.chdir("Governance")
    for file in glob.glob("*.sol"):
        print(file)
        solFiles.append(["backupContractDir/Governance/"+file, file])
    
    os.chdir("..")
    os.chdir("..")

def getProjectPath():
    rootPath = os.getcwd()

def main():
    getProjectPath()
    subprocess.run(["mv", "contracts", "backupContractDir"])
    getSolFiles()
    subprocess.run(["mkdir" , "SlitherResults"])
    for entry in solFiles:
        subprocess.run(["rm" , "-rf", "contracts"])
        subprocess.run(["rm" , "-rf", "artifacts"])
        subprocess.run(["mkdir" , "contracts"])
        subprocess.run(["cp", entry[0], "contracts/"])
        subprocess.run(["slither" , ".", "--json", "SlitherResults/"+entry[1]+".json", "--print", "human-summary"])
        subprocess.run(["rm" , "-rf", "contracts"])
        subprocess.run(["rm" , "-rf", "artifacts"])
        

    #revert everything
    subprocess.run(["rm" , "-rf", "contracts"])
    subprocess.run(["mv", "backupContractDir", "contracts"])
    subprocess.run(["rm" , "-rf", "artifacts"])

if __name__ == "__main__":
    main()


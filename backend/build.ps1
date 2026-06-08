$env:PATH = "C:\Users\POOJAJ~1\maven\apache-maven-3.9.14\bin;" + $env:PATH
Set-Location C:\wifibuild
& "C:\Users\POOJAJ~1\maven\apache-maven-3.9.14\bin\mvn.cmd" package -DskipTests -f C:\wifibuild\pom.xml

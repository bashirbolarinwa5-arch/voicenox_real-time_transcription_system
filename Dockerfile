# Step 1: Build the Maven application
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# FIXED LINE: Added -DskipTests to prevent Hibernate from trying to connect to a database during the build
RUN mvn clean package -DskipTests

# Step 2: Run the Spring Boot application using a clean Java runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 1999
ENTRYPOINT ["java", "-jar", "app.jar"]

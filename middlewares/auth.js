const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Roles that may access each protected endpoint.
    // Both customers and vendors can be added to any route as needed.
    // Path segments support regex, e.g. [0-9]+ for a numeric ID.
    const authorizedRoles = {
        // ===== Put routes that require a login here, e.g. =====
        // "GET /orders": ["customer", "vendor"],
        // "POST /orders": ["customer"],
        // "PUT /orders/[0-9]+": ["customer"],
        // "GET /stalls": ["customer", "vendor"],
    };

    const requestedEndpoint = `${req.method} ${req.url}`; // Include method in endpointl;
    const userRole = decoded.role;

    const authorizedRole = Object.entries(authorizedRoles).find(
      ([endpoint, roles]) => {
        const regex = new RegExp(`^${endpoint}$`); // Create RegExp from endpoint
        return regex.test(requestedEndpoint) && roles.includes(userRole);
      }
    );

    if (!authorizedRole) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user = decoded; // Attach decoded user information to the request object
    next();
  });
}

module.exports = {
  verifyJWT
}


// old version (just in case):

// const jwt = require("jsonwebtoken");

// function verifyJWT(req, res, next) {
//   const token =
//     req.headers.authorization && req.headers.authorization.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   jwt.verify(token, "your_secret_key", (err, decoded) => {
//     if (err) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     // Check user role for authorization (replace with your logic)
//     const authorizedRoles = {
//         // ===== Put routes that require a login here, e.g. =====
//         // "GET /endpoint": ["role1", "role2"], // (role1 & role2 can view "endpoint".)
//     };

//     const requestedEndpoint = `${req.method} ${req.url}`; // Include method in endpointl;
//     const userRole = decoded.role;

//     const authorizedRole = Object.entries(authorizedRoles).find(
//       ([endpoint, roles]) => {
//         const regex = new RegExp(`^${endpoint}$`); // Create RegExp from endpoint
//         return regex.test(requestedEndpoint) && roles.includes(userRole);
//       }
//     );

//     if (!authorizedRole) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     req.user = decoded; // Attach decoded user information to the request object
//     next();
//   });
// }

// module.exports = {
//   verifyJWT
// }
namespace TrackList.SignalR
{
    using System;
    using System.Collections.Generic;
    using System.Reflection;

    using Newtonsoft.Json;
    using Newtonsoft.Json.Serialization;

    public class CamelCaseContractResolver : DefaultContractResolver
    {
        public CamelCaseContractResolver()
        {
            AssembliesToInclude = new HashSet<Assembly>();
            TypesToInclude = new HashSet<Type>();
        }

        // Identifies assemblies to include in camel-casing
        public HashSet<Assembly> AssembliesToInclude { get; set; }

        // Identifies types to include in camel-casing
        public HashSet<Type> TypesToInclude { get; set; }

        protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
        {
            JsonProperty jsonProperty = base.CreateProperty(member, memberSerialization);
            Type declaringType = member.DeclaringType;
            if (TypesToInclude.Contains(declaringType) || AssembliesToInclude.Contains(declaringType.Assembly))
            {
                jsonProperty.PropertyName = GetCamelCase(jsonProperty.PropertyName);
            }
            return jsonProperty;
        }

        private static string GetCamelCase(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return value;
            }
            var firstChar = value[0];
            if (char.IsLower(firstChar))
            {
                return value;
            }
            firstChar = char.ToLowerInvariant(firstChar);
            return firstChar + value.Substring(1);
        }
    }
}